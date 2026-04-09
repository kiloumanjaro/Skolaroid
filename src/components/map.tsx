'use client';

import mapboxgl from 'mapbox-gl';
import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { getEraFromBatchTag } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createRoot, type Root } from 'react-dom/client';
import { Plus } from 'lucide-react';
import { AddMemoryModal } from './add-memory-modal';
import type { MemoryFilters } from './map/FilterMemoriesModal';
import { GroupPanel } from './groups/GroupPanel';
import { BatchesModal } from './batches-modal';
import { ExpandableToolbar } from './expandable-toolbar';
import { LandmarkMarker } from './map/LandmarkMarker';
import { LandmarkMemoriesPanel } from './map/LandmarkMemoriesPanel';
import { MemoryPin } from './map/MemoryPin';
import { MemoryPinStack } from './map/MemoryPinStack';
import { MemoryDetailModal } from './map/MemoryDetailModal';
import { useMemoryCountsByLandmark } from '@/lib/hooks/useMemoryCountsByLandmark';
import {
  useAllMemoriesWithCoordinates,
  type MemoryWithCoordinates,
} from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { LANDMARKS, type Landmark } from '@/lib/constants/landmarks';
import type {
  LocationSelectionMode,
  MapLocationSelection,
} from '@/lib/types/map';
import { MapLocationSelector } from './map/MapLocationSelector';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// ---------------------------------------------------------------------------
// Era → Mapbox style mapping
// Each decade gets a visually distinct style to convey the period feel.
// ---------------------------------------------------------------------------
const ERA_MAP_STYLES: Record<number, string> = {
  2020: 'mapbox://styles/mapbox/streets-v12', // Vibrant & modern
  2010: 'mapbox://styles/mapbox/light-v11', // Clean minimalist
  2000: 'mapbox://styles/mapbox/outdoors-v12', // Detailed outdoors
  1990: 'mapbox://styles/mapbox/satellite-streets-v12', // Classic photo map
  1980: 'mapbox://styles/mapbox/satellite-streets-v12',
  1970: 'mapbox://styles/mapbox/satellite-v9', // Vintage satellite
  1960: 'mapbox://styles/mapbox/satellite-v9',
  1950: 'mapbox://styles/mapbox/satellite-v9',
  1940: 'mapbox://styles/mapbox/satellite-v9',
};
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const ERA_OVERLAY: Record<number, { label: string; badge: string }> = {
  2020: { label: '2020s', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  2010: {
    label: '2010s',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  2000: {
    label: '2000s',
    badge: 'bg-green-100 text-green-800 border-green-200',
  },
  1990: {
    label: '1990s',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  1980: {
    label: '1980s',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  1970: {
    label: '1970s',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  1960: {
    label: '1960s',
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  1950: {
    label: '1950s',
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  1940: {
    label: '1940s',
    badge: 'bg-stone-100 text-stone-700 border-stone-200',
  },
};

/** Distance threshold (degrees) — if map center is already within this of the target, skip flyTo. */
const FLY_TO_THRESHOLD = 0.0001;

/** Delay (ms) after closing BatchesModal before starting flyTo, so the Dialog close animation completes. */
const MODAL_CLOSE_DELAY = 300;

/** Camera animation configuration for smooth, cinematic flyTo transitions. */
const CAMERA_ANIMATION = {
  speed: 0.8, // Slower speed = smoother, more cinematic
  curve: 1.2, // Gentle arc for natural movement
  targetZoom: 20, // Zoom level when selecting a memory
  essential: true, // Ensures animation is not skipped even if user prefers reduced motion
};

interface MapComponentProps {
  filters: MemoryFilters;
  onFilterOptionsChange?: (options: {
    availableTags: string[];
    availableYears: number[];
  }) => void;
}

export function MapComponent({
  filters,
  onFilterOptionsChange,
}: MapComponentProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [addMemoryOpen, setAddMemoryOpen] = useState(false);
  const [addMemoryEra, setAddMemoryEra] = useState<number | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [batchesModalOpen, setBatchesModalOpen] = useState(false);
  const [activeMapEra, setActiveMapEra] = useState(2020);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    null
  );
  const [selectedMemory, setSelectedMemory] =
    useState<MemoryWithCoordinates | null>(null);
  const [memoryDetailOpen, setMemoryDetailOpen] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [showMemoryPins, setShowMemoryPins] = useState(true);

  // Location selection mode for Add Memory flow
  const [locationSelectionMode, setLocationSelectionMode] =
    useState<LocationSelectionMode>('inactive');
  const [pendingLocationSelection, setPendingLocationSelection] =
    useState<MapLocationSelection | null>(null);
  const locationSelectionCallbackRef = useRef<
    ((selection: MapLocationSelection) => void) | null
  >(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerRootsRef = useRef<{ root: Root; landmark: Landmark }[]>([]);
  const memoryMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const memoryRootsRef = useRef<Root[]>([]);

  // Pending memory for the flyTo → open detail flow
  const pendingMemoryRef = useRef<MemoryWithCoordinates | null>(null);

  // Read era URL parameter on mount (for homepage → map navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eraParam = params.get('era');

    if (eraParam) {
      const eraValue = parseInt(eraParam, 10);
      if (!isNaN(eraValue)) {
        setActiveMapEra(eraValue);
      }
    }
  }, []); // Empty deps - only run on mount

  const { data: countsData } = useMemoryCountsByLandmark();
  const memoryCounts = useMemo(() => countsData?.data ?? {}, [countsData]);

  const { data: memoriesData, isLoading: memoriesLoading } =
    useAllMemoriesWithCoordinates();
  const memories = useMemo(() => memoriesData?.data ?? [], [memoriesData]);

  // Only show memory pins for the active era (based on batch tag)
  const eraFilteredMemories = useMemo(() => {
    return memories.filter(
      (m) => getEraFromBatchTag(m.tags ?? [], m.createdAt) === activeMapEra
    );
  }, [memories, activeMapEra]);

  const tagFilteredMemories = useMemo(() => {
    return eraFilteredMemories.filter((memory) => {
      // Tag filter
      if (filters.selectedTags.length > 0) {
        const memoryTagNames = memory.tags?.map((t) => t.name) ?? [];
        const hasAllTags = filters.selectedTags.every((tag) =>
          memoryTagNames.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      // Year filter
      if (filters.selectedYear) {
        const memoryDateValue = (memory as { memoryDate?: string }).memoryDate;
        const memoryYear = memoryDateValue
          ? new Date(memoryDateValue).getFullYear()
          : new Date(memory.createdAt ?? Date.now()).getFullYear();
        if (memoryYear !== filters.selectedYear) return false;
      }

      // Visibility filter
      if (filters.visibility !== 'ALL') {
        if (memory.visibility !== filters.visibility) return false;
      }

      return true;
    });
  }, [eraFilteredMemories, filters]);

  const sortedMemories = useMemo(() => {
    const sorted = [...tagFilteredMemories];
    switch (filters.sortBy) {
      case 'date-newest':
        return sorted.sort((a, b) => {
          const aDate = new Date(a.createdAt ?? Date.now()).getTime();
          const bDate = new Date(b.createdAt ?? Date.now()).getTime();
          return bDate - aDate;
        });
      case 'date-oldest':
        return sorted.sort((a, b) => {
          const aDate = new Date(a.createdAt ?? Date.now()).getTime();
          const bDate = new Date(b.createdAt ?? Date.now()).getTime();
          return aDate - bDate;
        });
      case 'upvotes-high':
      case 'upvotes-low':
      default:
        return sorted;
    }
  }, [tagFilteredMemories, filters.sortBy]);

  const displayedMemories = sortedMemories;

  const availableTags = useMemo(
    () =>
      Array.from(
        new Set(
          eraFilteredMemories.flatMap((m) => m.tags?.map((t) => t.name) ?? [])
        )
      ).sort(),
    [eraFilteredMemories]
  );

  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          eraFilteredMemories.map((m) => {
            const memoryDateValue = (m as { memoryDate?: string }).memoryDate;
            const date = memoryDateValue
              ? new Date(memoryDateValue)
              : new Date(m.createdAt ?? Date.now());
            return date.getFullYear();
          })
        )
      ).sort((a, b) => b - a),
    [eraFilteredMemories]
  );

  useEffect(() => {
    onFilterOptionsChange?.({
      availableTags,
      availableYears,
    });
  }, [availableTags, availableYears, onFilterOptionsChange]);

  // Keep a stable ref for the click handler so detached roots always call the latest version
  const handleClickRef = useRef<(landmark: Landmark) => void>(() => {});
  useLayoutEffect(() => {
    handleClickRef.current = (landmark: Landmark) => {
      setSelectedLandmark(landmark);
    };
  });

  const handleLandmarkClick = useCallback((landmark: Landmark) => {
    handleClickRef.current(landmark);
  }, []);

  const handleMemoryClickRef = useRef<(memory: MemoryWithCoordinates) => void>(
    () => {}
  );
  useLayoutEffect(() => {
    handleMemoryClickRef.current = (memory: MemoryWithCoordinates) => {
      setSelectedMemory(memory);
      setMemoryDetailOpen(true);
    };
  });

  const handleMemoryClick = useCallback((memory: MemoryWithCoordinates) => {
    handleMemoryClickRef.current(memory);
  }, []);

  // ---------------------------------------------------------------------------
  // Batches → FlyTo → Detail handler
  // ---------------------------------------------------------------------------

  // Helper: Direct flyTo with optional callback on completion
  const flyToMemoryWithSequence = useCallback(
    (memory: MemoryWithCoordinates, onComplete?: () => void) => {
      const map = mapRef.current;
      if (!map) {
        onComplete?.();
        return;
      }

      // Direct flyTo with cinematic animation settings
      map.flyTo({
        center: [memory.location.longitude, memory.location.latitude],
        zoom: CAMERA_ANIMATION.targetZoom,
        speed: CAMERA_ANIMATION.speed,
        curve: CAMERA_ANIMATION.curve,
        duration: 1500,
        essential: CAMERA_ANIMATION.essential,
      });

      // Call completion callback when move ends
      const onMoveEnd = () => {
        map.off('moveend', onMoveEnd);
        onComplete?.();
      };
      map.once('moveend', onMoveEnd);
    },
    []
  );

  const handleBatchesMemorySelected = useCallback(
    (memory: MemoryWithCoordinates) => {
      // Close the batches modal (already done by BatchesModal, but ensure state is synced)
      setBatchesModalOpen(false);

      // Cancel any previous pending flyTo
      pendingMemoryRef.current = memory;

      const map = mapRef.current;

      // Fallback: if map isn't ready, just open the detail modal directly
      if (!map) {
        setSelectedMemory(memory);
        setMemoryDetailOpen(true);
        pendingMemoryRef.current = null;
        return;
      }

      const memoryEra = getEraFromBatchTag(memory.tags ?? [], memory.createdAt);
      const needsEraSwitch = memoryEra !== activeMapEra;

      const targetLng = memory.location.longitude;
      const targetLat = memory.location.latitude;

      // Check if the map is already centered on the target
      const center = map.getCenter();
      const isAlreadyCentered =
        Math.abs(center.lng - targetLng) < FLY_TO_THRESHOLD &&
        Math.abs(center.lat - targetLat) < FLY_TO_THRESHOLD &&
        !needsEraSwitch;

      // Helper: fly to the memory location with sequence, then open the detail modal
      const flyAndOpen = () => {
        // Guard: if a different memory was selected in the meantime, bail
        if (pendingMemoryRef.current?.id !== memory.id) return;

        if (isAlreadyCentered) {
          // Already there — open immediately
          setSelectedMemory(memory);
          setMemoryDetailOpen(true);
          pendingMemoryRef.current = null;
          return;
        }

        // Use the cinematic sequence: zoom out → fly → zoom in
        flyToMemoryWithSequence(memory, () => {
          // Guard against stale events
          if (pendingMemoryRef.current?.id !== memory.id) return;
          setSelectedMemory(memory);
          setMemoryDetailOpen(true);
          pendingMemoryRef.current = null;
        });
      };

      // Delay to let the BatchesModal Dialog close animation finish
      setTimeout(() => {
        // Guard: if a different memory was selected in the meantime, bail
        if (pendingMemoryRef.current?.id !== memory.id) return;

        if (needsEraSwitch) {
          // Switch era — directly call setStyle and listen for the event before flying.
          // Important: attach listener BEFORE calling setStyle to ensure we catch the event.
          const targetStyle = ERA_MAP_STYLES[memoryEra] ?? DEFAULT_MAP_STYLE;

          const onStyleLoad = () => {
            map.off('style.load', onStyleLoad);
            // Guard: different memory selected?
            if (pendingMemoryRef.current?.id !== memory.id) return;
            flyAndOpen();
          };

          map.on('style.load', onStyleLoad);
          map.setStyle(targetStyle);
          setActiveMapEra(memoryEra);
        } else {
          flyAndOpen();
        }
      }, MODAL_CLOSE_DELAY);
    },
    [activeMapEra, flyToMemoryWithSequence]
  );

  // Clear pending memory when user opens another modal or performs an action
  // that should cancel the flyTo flow
  const cancelPendingFlyTo = useCallback(() => {
    pendingMemoryRef.current = null;
  }, []);

  // ---------------------------------------------------------------------------
  // Location Selection Mode handlers
  // ---------------------------------------------------------------------------

  const handleCancelMapSelection = useCallback(() => {
    setLocationSelectionMode('inactive');
    locationSelectionCallbackRef.current = null;
    setPendingLocationSelection(null);
    // Restore defaults
    setShowLandmarks(false);
    setShowMemoryPins(true);
  }, []);

  const handleLocationSelected = useCallback(
    (selection: MapLocationSelection) => {
      locationSelectionCallbackRef.current?.(selection);
      setLocationSelectionMode('inactive');
      locationSelectionCallbackRef.current = null;
      setPendingLocationSelection(null);
      // Restore defaults
      setShowLandmarks(false);
      setShowMemoryPins(true);
    },
    []
  );

  // Update click handler to integrate with selection mode
  useEffect(() => {
    handleClickRef.current = (landmark: Landmark) => {
      if (locationSelectionMode === 'landmark') {
        handleLocationSelected({
          mode: 'landmark',
          landmark,
          locationId: landmark.id,
        });
        return;
      }
      setSelectedLandmark(landmark);
    };
  }, [locationSelectionMode, handleLocationSelected]);

  const handleRequestMapSelection = useCallback(
    (
      mode: 'landmark' | 'custom',
      onSelect: (selection: MapLocationSelection) => void
    ) => {
      locationSelectionCallbackRef.current = onSelect;
      setLocationSelectionMode(mode);
      setPendingLocationSelection(null);

      // Show landmarks when selecting landmark, hide memory pins during selection
      if (mode === 'landmark') {
        setShowLandmarks(true);
      }
      setShowMemoryPins(false);

      // Re-open the modal after selection or cancel
      setAddMemoryOpen(true);
    },
    []
  );

  useLayoutEffect(() => {
    setIsClient(true);
    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured');
      return;
    }
    if (!mapboxgl.supported()) {
      setMapError(
        'WebGL is not supported on this browser. Please use a modern browser with WebGL support.'
      );
      return;
    }
  }, []);

  useEffect(() => {
    if (!isClient || !MAPBOX_TOKEN || mapError) {
      return;
    }

    if (mapContainerRef.current && !mapRef.current) {
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [123.8986, 10.3224],
          zoom: 17,
          minZoom: 16,
          maxZoom: 22,
          maxBounds: [
            [123.89, 10.32],
            [123.91, 10.33],
          ],
          attributionControl: false,
        });

        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl(), 'top-left');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

        // Create landmark markers (but don't add to map yet — visibility effect handles this)
        LANDMARKS.forEach((landmark) => {
          const el = document.createElement('div');
          const root = createRoot(el);
          root.render(
            <LandmarkMarker
              landmark={landmark}
              memoryCount={0}
              onClick={handleLandmarkClick}
            />
          );

          markerRootsRef.current.push({ root, landmark });

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
          }).setLngLat(landmark.coordinates);
          // Don't add to map here — let visibility effect handle it

          markersRef.current.push(marker);
        });

        return () => {
          markersRef.current.forEach((m) => m.remove());
          markersRef.current = [];
          memoryMarkersRef.current.forEach((m) => m.remove());
          memoryMarkersRef.current = [];

          // Unmount React roots asynchronously to avoid race condition
          const rootsToUnmount = [
            ...markerRootsRef.current,
            ...memoryRootsRef.current,
          ];
          setTimeout(() => {
            rootsToUnmount.forEach((item) => {
              if ('root' in item) {
                item.root.unmount();
              } else {
                item.unmount();
              }
            });
          }, 0);

          markerRootsRef.current = [];
          memoryRootsRef.current = [];
          map.remove();
          mapRef.current = null;
        };
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setTimeout(() => {
          setMapError(
            'Failed to initialize map. Please refresh the page or try a different browser.'
          );
        }, 0);
      }
    }
  }, [isClient, handleLandmarkClick, mapError]);

  // Handle memoryId URL param (for gallery → map navigation)
  useEffect(() => {
    if (!mapRef.current || memoriesLoading || !memories) return;

    const params = new URLSearchParams(window.location.search);
    const memoryIdParam = params.get('memoryId');
    const eraParam = params.get('era');

    if (!memoryIdParam) return;

    // Find the memory by ID
    const targetMemory = memories.find((m) => m.id === memoryIdParam);
    if (!targetMemory) {
      console.warn(`Memory with ID ${memoryIdParam} not found`);
      return;
    }

    // Switch era if needed
    const memoryEra = getEraFromBatchTag(
      targetMemory.tags ?? [],
      targetMemory.createdAt
    );
    if (eraParam && memoryEra !== activeMapEra) {
      setActiveMapEra(memoryEra);
      mapRef.current.setStyle(ERA_MAP_STYLES[memoryEra]);
    }

    // Wait for style to load, then fly to memory and open modal
    const onStyleLoad = () => {
      mapRef.current?.off('style.load', onStyleLoad);
      setTimeout(() => {
        flyToMemoryWithSequence(targetMemory, () => {
          setSelectedMemory(targetMemory);
          setMemoryDetailOpen(true);
        });
      }, 300);
    };

    if (memoryEra !== activeMapEra) {
      mapRef.current.on('style.load', onStyleLoad);
    } else {
      setTimeout(() => {
        flyToMemoryWithSequence(targetMemory, () => {
          setSelectedMemory(targetMemory);
          setMemoryDetailOpen(true);
        });
      }, 300);
    }

    // Clear URL params after processing (optional - keeps URL clean)
    window.history.replaceState({}, '', window.location.pathname);
  }, [
    memories,
    memoriesLoading,
    activeMapEra,
    flyToMemoryWithSequence,
    setActiveMapEra,
    setSelectedMemory,
    setMemoryDetailOpen,
  ]);

  // Switch Mapbox style when the active era changes
  useEffect(() => {
    if (!mapRef.current) return;
    const targetStyle = ERA_MAP_STYLES[activeMapEra] ?? DEFAULT_MAP_STYLE;
    mapRef.current.setStyle(targetStyle);
  }, [activeMapEra]);

  // Re-render marker roots when memory counts update or visibility changes
  useEffect(() => {
    for (const { root, landmark } of markerRootsRef.current) {
      root.render(
        <LandmarkMarker
          landmark={landmark}
          memoryCount={memoryCounts[landmark.id] ?? 0}
          onClick={handleLandmarkClick}
        />
      );
    }
  }, [memoryCounts, handleLandmarkClick]);

  // Toggle landmark marker visibility by adding/removing from map
  useEffect(() => {
    if (!mapRef.current) return;

    if (showLandmarks) {
      // Add landmark markers to the map
      markersRef.current.forEach((marker) => {
        marker.addTo(mapRef.current!);
      });
    } else {
      // Remove landmark markers from the map
      markersRef.current.forEach((marker) => {
        marker.remove();
      });
    }
  }, [showLandmarks]);

  // Toggle memory pin marker visibility
  useEffect(() => {
    if (!showMemoryPins) {
      // Clean up memory markers when hiding pins
      memoryMarkersRef.current.forEach((m) => m.remove());
      memoryMarkersRef.current = [];

      const oldRoots = [...memoryRootsRef.current];
      memoryRootsRef.current = [];
      setTimeout(() => {
        oldRoots.forEach((r) => r.unmount());
      }, 0);
    }
  }, [showMemoryPins]);

  // Render memory pin markers (with stacking for overlapping locations)
  useEffect(() => {
    if (!mapRef.current || memories.length === 0 || !showMemoryPins) return;

    // Clean up existing memory markers
    memoryMarkersRef.current.forEach((m) => m.remove());
    memoryMarkersRef.current = [];

    // Unmount roots asynchronously to avoid race condition
    const oldRoots = [...memoryRootsRef.current];
    memoryRootsRef.current = [];
    setTimeout(() => {
      oldRoots.forEach((r) => r.unmount());
    }, 0);

    // Group memories by location coordinates (rounded to 5 decimal places)
    const groups = new Map<
      string,
      { lng: number; lat: number; memories: typeof eraFilteredMemories }
    >();

    for (const memory of displayedMemories) {
      if (!memory.mediaURL) continue;
      const key = `${memory.location.longitude.toFixed(5)},${memory.location.latitude.toFixed(5)}`;
      if (!groups.has(key)) {
        groups.set(key, {
          lng: memory.location.longitude,
          lat: memory.location.latitude,
          memories: [],
        });
      }
      groups.get(key)!.memories.push(memory);
    }

    // Render grouped pins
    for (const [, group] of groups) {
      const el = document.createElement('div');
      const root = createRoot(el);

      if (group.memories.length === 1) {
        const memory = group.memories[0];
        root.render(
          <MemoryPin
            src={memory.mediaURL!}
            alt={memory.title}
            onClick={() => handleMemoryClick(memory)}
          />
        );
      } else {
        root.render(
          <MemoryPinStack
            memories={group.memories
              .filter((m) => m.mediaURL)
              .map((m) => ({
                id: m.id,
                title: m.title,
                mediaURL: m.mediaURL!,
              }))}
            onClick={(memoryId) => {
              const found = group.memories.find((m) => m.id === memoryId);
              if (found) handleMemoryClick(found);
            }}
          />
        );
      }

      memoryRootsRef.current.push(root);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([group.lng, group.lat])
        .addTo(mapRef.current!);

      memoryMarkersRef.current.push(marker);
    }
  }, [
    displayedMemories,
    displayedMemories.length,
    memories.length,
    handleMemoryClick,
    showMemoryPins,
  ]);

  if (!isClient) {
    return <div className="relative h-full w-full" />;
  }

  if (mapError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-red-50">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-red-600">{mapError}</h2>
          <p className="text-red-600">
            {!MAPBOX_TOKEN
              ? 'Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file'
              : 'Please refresh the page and try again'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Era indicator — bottom left, above Mapbox attribution */}
      {(() => {
        const era = ERA_OVERLAY[activeMapEra];
        if (!era) return null;
        return (
          <div className="absolute bottom-8 left-4 z-10 flex items-center gap-3">
            <button
              onClick={() => {
                window.location.href = `/gallery?era=${activeMapEra}`;
              }}
              className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-[3px_3px_0px_0px_#2d2d2d] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              View Gallery
            </button>

            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${era.badge}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {era.label} Map
            </div>
          </div>
        );
      })()}

      {/* Add Memory Button - Bottom Right */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3">
        <div className="group flex items-center gap-0 rounded-full bg-white p-2 shadow-lg transition-all duration-300 hover:gap-3">
          <button
            onClick={() => setAddMemoryOpen(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-skolaroid-blue text-white shadow-lg transition-all hover:bg-skolaroid-blue/90 hover:shadow-xl active:scale-95"
            aria-label="Add memory"
          >
            <Plus size={20} />
          </button>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-gray-700 opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:pr-3 group-hover:opacity-100">
            Add Memory
          </span>
        </div>
      </div>

      {/* Expandable Toolbar - Top Right */}
      <ExpandableToolbar
        onPrimaryClick={() => setGroupModalOpen(true)}
        onBatchesClick={() => setBatchesModalOpen(true)}
        onConfigureClick={() => router.push('/admin')}
      />

      {/* Group Panel */}
      <GroupPanel
        open={groupModalOpen}
        onOpenChange={(isOpen) => {
          setGroupModalOpen(isOpen);
          if (isOpen) cancelPendingFlyTo();
        }}
      />

      {/* Batches Modal */}
      <BatchesModal
        open={batchesModalOpen}
        onOpenChange={setBatchesModalOpen}
        activeMapEra={activeMapEra}
        memories={memories}
        onAddMemory={(era) => {
          setBatchesModalOpen(false);
          setAddMemoryEra(era ?? activeMapEra);
          setAddMemoryOpen(true);
        }}
        onMemorySelected={handleBatchesMemorySelected}
      />

      {/* Add Memory Modal */}
      <AddMemoryModal
        open={addMemoryOpen && locationSelectionMode === 'inactive'}
        onOpenChange={(isOpen) => {
          setAddMemoryOpen(isOpen);
          if (!isOpen) {
            setAddMemoryEra(null);
            handleCancelMapSelection();
          }
        }}
        defaultEra={addMemoryEra}
        onRequestMapSelection={handleRequestMapSelection}
      />

      {/* Map Location Selector Overlay */}
      {locationSelectionMode !== 'inactive' && (
        <MapLocationSelector
          mode={locationSelectionMode}
          onCancel={handleCancelMapSelection}
          onLocationSelected={handleLocationSelected}
          pendingSelection={pendingLocationSelection}
          mapRef={mapRef}
        />
      )}

      {/* Landmark Memories Panel */}
      <LandmarkMemoriesPanel
        landmark={selectedLandmark}
        memoryCount={
          selectedLandmark ? (memoryCounts[selectedLandmark.id] ?? 0) : 0
        }
        onClose={() => setSelectedLandmark(null)}
      />

      {/* Memory Detail Modal */}
      <MemoryDetailModal
        memory={selectedMemory}
        open={memoryDetailOpen}
        onOpenChange={setMemoryDetailOpen}
        onMemoryDeleted={() => setSelectedMemory(null)}
        hasPrevious={
          selectedMemory
            ? memories.findIndex((m) => m.id === selectedMemory.id) > 0
            : false
        }
        hasNext={
          selectedMemory
            ? memories.findIndex((m) => m.id === selectedMemory.id) <
              memories.length - 1
            : false
        }
        onPrevious={() => {
          if (selectedMemory) {
            const currentIndex = memories.findIndex(
              (m) => m.id === selectedMemory.id
            );
            const prevMemory = memories[currentIndex - 1];
            if (prevMemory) {
              // Set memory immediately so the flip back-face shows new content
              setSelectedMemory(prevMemory);
              flyToMemoryWithSequence(prevMemory);
            }
          }
        }}
        onNext={() => {
          if (selectedMemory) {
            const currentIndex = memories.findIndex(
              (m) => m.id === selectedMemory.id
            );
            const nextMemory = memories[currentIndex + 1];
            if (nextMemory) {
              // Set memory immediately so the flip back-face shows new content
              setSelectedMemory(nextMemory);
              flyToMemoryWithSequence(nextMemory);
            }
          }
        }}
      />
    </div>
  );
}
