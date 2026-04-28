'use client';

import mapboxgl from 'mapbox-gl';
import { Layers } from 'lucide-react';
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
import { AddMemoryModal } from './add-memory-modal';
import { GroupPanel } from './groups/GroupPanel';
import { BatchesModal } from './batches-modal';
import { ExpandableToolbar } from './expandable-toolbar';
import { useMainShellSidebarAction } from './main-shell-sidebar-action';
import { LandmarkMarker } from './map/LandmarkMarker';
import { LandmarkMemoriesPanel } from './map/LandmarkMemoriesPanel';
import { MemoryPin } from './map/MemoryPin';
import { MemoryPinStack } from './map/MemoryPinStack';
import { MemoryDetailModal } from './map/MemoryDetailModal';
import { useMemoryCountsByLandmark } from '@/lib/hooks/useMemoryCountsByLandmark';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useMemoriesByCreator } from '@/lib/hooks/useMemoriesByCreator';
import { MapFirstMemoryPrompt } from './map/MapFirstMemoryPrompt';
import {
  useAllMemoriesWithCoordinates,
  type MemoryWithCoordinates,
} from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { useLocations } from '@/lib/hooks/useLocations';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import { LANDMARKS, type Landmark } from '@/lib/constants/landmarks';
import type {
  LocationSelectionMode,
  MapLocationSelection,
} from '@/lib/types/map';
import { AddMemoryButton } from './map/AddMemoryButton';
import { MapAnnouncementStrip } from './map/MapAnnouncementStrip';
import { MapLocationSelector } from './map/MapLocationSelector';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// ---------------------------------------------------------------------------
// Era → Mapbox style mapping
// Use the outdoors style consistently across all eras.
// ---------------------------------------------------------------------------
const ERA_MAP_STYLES: Record<number, string> = {
  2020: 'mapbox://styles/mapbox/outdoors-v12',
  2010: 'mapbox://styles/mapbox/outdoors-v12',
  2000: 'mapbox://styles/mapbox/outdoors-v12',
  1990: 'mapbox://styles/mapbox/outdoors-v12',
  1980: 'mapbox://styles/mapbox/outdoors-v12',
  1970: 'mapbox://styles/mapbox/outdoors-v12',
  1960: 'mapbox://styles/mapbox/outdoors-v12',
  1950: 'mapbox://styles/mapbox/outdoors-v12',
  1940: 'mapbox://styles/mapbox/outdoors-v12',
};
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

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

const DEFAULT_MAP_CENTER: [number, number] = [123.8986, 10.3224];
const DEFAULT_MAP_ZOOM = 17;
const EMPTY_USER_GROUPS: { id: string; name: string }[] = [];
const MAP_ANNOUNCEMENTS = [
  'Campus stories pinned where they happened',
  'Switch eras to explore memories across batches',
  'Drop a memory and add to the living archive',
];

type SortOption =
  | 'date-newest'
  | 'date-oldest'
  | 'upvotes-high'
  | 'upvotes-low';

type VisibilityFilter =
  | 'ALL'
  | 'PUBLIC'
  | 'BATCH_ONLY'
  | 'PROGRAM_ONLY'
  | 'GROUP_ONLY';

interface MemoryFilters {
  sortBy: SortOption;
  visibility: VisibilityFilter;
  selectedTags: string[];
  selectedYear: number | null;
  selectedGroupId: string | null;
  selectedLocationId: string | null;
  searchQuery: string;
}

interface GroupFilterOption {
  id: string;
  name: string;
}

interface LocationFilterOption {
  id: string;
  name: string;
}

interface MapComponentProps {
  filters: MemoryFilters;
  onFilterOptionsChange?: (options: {
    availableTags: string[];
    availableYears: number[];
    availableGroups: GroupFilterOption[];
    availableLocations: LocationFilterOption[];
  }) => void;
  onMemoryDetailOpenRequest?: () => Promise<void> | void;
  onMemoryDetailOpenStateChange?: (open: boolean) => void;
}

export function MapComponent({
  filters,
  onFilterOptionsChange,
  onMemoryDetailOpenRequest,
  onMemoryDetailOpenStateChange,
}: MapComponentProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const processedMemoryParamRef = useRef<string | null>(null);
  const cameraFocusedMemoryParamRef = useRef<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
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
  const memoryOpenSequenceRef = useRef(0);

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
  const { data: currentUserData } = useCurrentUser();
  const currentUserId = currentUserData?.data?.id;
  const { data: creatorMemoriesData, isLoading: creatorMemoriesLoading } =
    useMemoriesByCreator(currentUserId);
  const { data: locationsData } = useLocations();
  const { data: userGroupsData } = useUserGroups();
  const userGroups = userGroupsData ?? EMPTY_USER_GROUPS;
  const isAdmin = currentUserData?.data?.role === 'ADMIN';

  const showFirstMemoryPrompt =
    !!currentUserData?.data &&
    !creatorMemoriesLoading &&
    creatorMemoriesData?.data?.length === 0 &&
    !addMemoryOpen;

  const availableGroups = useMemo<GroupFilterOption[]>(
    () =>
      userGroups
        .map((group) => ({ id: group.id, name: group.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [userGroups]
  );

  // Only show memory pins for the active era (based on batch tag)
  const eraFilteredMemories = useMemo(() => {
    return memories.filter(
      (m) => getEraFromBatchTag(m.tags ?? [], m.createdAt) === activeMapEra
    );
  }, [memories, activeMapEra]);

  const selectedMemoryIndex = useMemo(
    () =>
      selectedMemory
        ? memories.findIndex((m) => m.id === selectedMemory.id)
        : -1,
    [memories, selectedMemory]
  );
  const previousSelectedMemory =
    selectedMemoryIndex > 0 ? memories[selectedMemoryIndex - 1] : null;
  const nextSelectedMemory =
    selectedMemoryIndex >= 0 && selectedMemoryIndex < memories.length - 1
      ? memories[selectedMemoryIndex + 1]
      : null;

  const tagFilteredMemories = useMemo(() => {
    return eraFilteredMemories.filter((memory) => {
      // ── SEARCH FILTER (live, applied first) ────────────────────────────────
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const inTitle = (memory.title ?? '').toLowerCase().includes(q);
        const inDesc = (memory.description ?? '').toLowerCase().includes(q);
        const inLocation = (
          (memory.location as { buildingName?: string } | undefined)
            ?.buildingName ?? ''
        )
          .toLowerCase()
          .includes(q);
        const inTags = (memory.tags ?? []).some((t) =>
          t.name.toLowerCase().includes(q)
        );
        if (!inTitle && !inDesc && !inLocation && !inTags) return false;
      }

      // ── TAG FILTER (unchanged) ─────────────────────────────────────────────
      if (filters.selectedTags.length > 0) {
        const memoryTagNames = memory.tags?.map((t) => t.name) ?? [];
        const hasAllTags = filters.selectedTags.every((tag) =>
          memoryTagNames.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      // ── YEAR FILTER (unchanged) ────────────────────────────────────────────
      if (filters.selectedYear) {
        const memoryDateValue = (memory as { memoryDate?: string }).memoryDate;
        const memoryYear = memoryDateValue
          ? new Date(memoryDateValue).getFullYear()
          : new Date(memory.createdAt ?? Date.now()).getFullYear();
        if (memoryYear !== filters.selectedYear) return false;
      }

      // ── VISIBILITY FILTER (unchanged) ─────────────────────────────────────
      if (filters.visibility !== 'ALL') {
        if (memory.visibility !== filters.visibility) return false;
      }

      // ── GROUP FILTER (unchanged) ───────────────────────────────────────────
      if (filters.selectedGroupId) {
        if (memory.privateGroupId !== filters.selectedGroupId) return false;
      }

      // ── LOCATION FILTER (unchanged) ───────────────────────────────────────
      if (filters.selectedLocationId) {
        const locationId = (memory.location as { id?: string } | undefined)?.id;
        if (locationId !== filters.selectedLocationId) return false;
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

  const availableLocations = useMemo<LocationFilterOption[]>(() => {
    const locationIdsInEra = new Set(
      eraFilteredMemories
        .map((memory) => (memory.location as { id?: string } | undefined)?.id)
        .filter((id): id is string => Boolean(id))
    );

    if (locationsData?.data?.length) {
      return locationsData.data
        .filter(
          (location) =>
            locationIdsInEra.size === 0 || locationIdsInEra.has(location.id)
        )
        .map((location) => ({
          id: location.id,
          name: location.buildingName,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const fallbackLocations = new Map<string, LocationFilterOption>();

    for (const memory of eraFilteredMemories) {
      const location = memory.location as
        | { id?: string; buildingName: string }
        | undefined;

      if (!location?.id) continue;

      fallbackLocations.set(location.id, {
        id: location.id,
        name: location.buildingName,
      });
    }

    return Array.from(fallbackLocations.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [eraFilteredMemories, locationsData]);

  useEffect(() => {
    onFilterOptionsChange?.({
      availableTags,
      availableYears,
      availableGroups,
      availableLocations,
    });
  }, [
    availableTags,
    availableYears,
    availableGroups,
    availableLocations,
    onFilterOptionsChange,
  ]);

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

  const openMemoryDetail = useCallback(
    async (memory: MemoryWithCoordinates) => {
      const sequenceId = ++memoryOpenSequenceRef.current;

      setSelectedMemory(memory);
      await Promise.resolve(onMemoryDetailOpenRequest?.());

      if (memoryOpenSequenceRef.current !== sequenceId) return;

      setMemoryDetailOpen(true);
      onMemoryDetailOpenStateChange?.(true);
    },
    [onMemoryDetailOpenRequest, onMemoryDetailOpenStateChange]
  );

  const handleMemoryClickRef = useRef<(memory: MemoryWithCoordinates) => void>(
    () => {}
  );
  useLayoutEffect(() => {
    handleMemoryClickRef.current = (memory: MemoryWithCoordinates) => {
      void openMemoryDetail(memory);
    };
  }, [openMemoryDetail]);

  const handleMemoryClick = useCallback((memory: MemoryWithCoordinates) => {
    handleMemoryClickRef.current(memory);
  }, []);

  const closeNotebookView = useCallback(() => {
    const map = mapRef.current;

    setMemoryDetailOpen(false);
    onMemoryDetailOpenStateChange?.(false);
    setSelectedMemory(null);
    setSelectedLandmark(null);

    // Return to the default overview camera after leaving notebook mode.
    map?.easeTo({
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      duration: 900,
      essential: true,
    });

    const params = new URLSearchParams(window.location.search);
    params.delete('memoryId');
    params.set('era', String(activeMapEra));

    processedMemoryParamRef.current = null;
    cameraFocusedMemoryParamRef.current = null;

    const nextUrl = `/map?${params.toString()}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [activeMapEra, onMemoryDetailOpenStateChange, router]);

  // Force Escape behavior for notebook mode: close and return to era map URL.
  useEffect(() => {
    if (!memoryDetailOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeNotebookView();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [memoryDetailOpen, closeNotebookView]);

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
        void openMemoryDetail(memory);
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
          void openMemoryDetail(memory);
          pendingMemoryRef.current = null;
          return;
        }

        // Use the cinematic sequence: zoom out → fly → zoom in
        flyToMemoryWithSequence(memory, () => {
          // Guard against stale events
          if (pendingMemoryRef.current?.id !== memory.id) return;
          void openMemoryDetail(memory);
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
    [activeMapEra, flyToMemoryWithSequence, openMemoryDetail]
  );

  // Clear pending memory when user opens another modal or performs an action
  // that should cancel the flyTo flow
  const cancelPendingFlyTo = useCallback(() => {
    pendingMemoryRef.current = null;
  }, []);

  const openBatchesModal = useCallback(() => {
    cancelPendingFlyTo();
    setBatchesModalOpen(true);
  }, [cancelPendingFlyTo]);

  const batchesSidebarAction = useMemo(
    () => ({
      id: 'map-batches',
      label: 'Batches',
      icon: <Layers className="h-5 w-5" />,
      onClick: openBatchesModal,
    }),
    [openBatchesModal]
  );

  useMainShellSidebarAction(batchesSidebarAction);

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

      if (mode === 'landmark') {
        setShowLandmarks(true);
      }
      setShowMemoryPins(false);
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
          style: DEFAULT_MAP_STYLE,
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
          minZoom: 16,
          maxZoom: 22,
          maxBounds: [
            [123.89, 10.32],
            [123.91, 10.33],
          ],
          attributionControl: false,
        });

        mapRef.current = map;
        map.once('load', () => {
          setMapReady(true);
        });

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
          setMapReady(false);
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

  // Phase 1: open notebook immediately when a memoryId is present
  useEffect(() => {
    if (memoriesLoading || memories.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const memoryIdParam = params.get('memoryId');

    if (!memoryIdParam) return;
    if (processedMemoryParamRef.current === memoryIdParam) return;

    // Find the memory by ID
    const targetMemory = memories.find((m) => m.id === memoryIdParam);
    if (!targetMemory) {
      console.warn(`Memory with ID ${memoryIdParam} not found`);
      processedMemoryParamRef.current = memoryIdParam;
      return;
    }

    processedMemoryParamRef.current = memoryIdParam;
    void openMemoryDetail(targetMemory);
  }, [memories, memoriesLoading, openMemoryDetail]);

  // Phase 2: once map is ready, align era and camera for the selected memory
  useEffect(() => {
    if (
      !mapRef.current ||
      !mapReady ||
      memoriesLoading ||
      memories.length === 0
    )
      return;

    const params = new URLSearchParams(window.location.search);
    const memoryIdParam = params.get('memoryId');

    if (!memoryIdParam) return;
    if (cameraFocusedMemoryParamRef.current === memoryIdParam) return;

    const targetMemory = memories.find((m) => m.id === memoryIdParam);
    if (!targetMemory) {
      cameraFocusedMemoryParamRef.current = memoryIdParam;
      return;
    }

    cameraFocusedMemoryParamRef.current = memoryIdParam;

    // Switch era if needed
    const memoryEra = getEraFromBatchTag(
      targetMemory.tags ?? [],
      targetMemory.createdAt
    );

    if (memoryEra !== activeMapEra) {
      const map = mapRef.current;
      if (!map) return;

      const onStyleLoad = () => {
        map.off('style.load', onStyleLoad);
        setTimeout(() => {
          flyToMemoryWithSequence(targetMemory);
        }, 300);
      };

      map.on('style.load', onStyleLoad);
      setActiveMapEra(memoryEra);
    } else {
      setTimeout(() => {
        flyToMemoryWithSequence(targetMemory);
      }, 300);
    }
  }, [
    memories,
    memoriesLoading,
    activeMapEra,
    mapReady,
    flyToMemoryWithSequence,
  ]);

  // Switch Mapbox style when the active era changes
  useEffect(() => {
    if (!mapRef.current) return;
    const targetStyle = ERA_MAP_STYLES[activeMapEra] ?? DEFAULT_MAP_STYLE;
    mapRef.current.setStyle(targetStyle);
  }, [activeMapEra]);

  // Keep URL in sync with notebook state so each opened memory has a stable deep link.
  useEffect(() => {
    if (!isClient) return;

    const params = new URLSearchParams(window.location.search);
    const currentMemoryIdParam = params.get('memoryId');

    // If a memoryId came from an external navigation (e.g., gallery click),
    // preserve it only until initial notebook selection is established.
    const hasPendingIncomingMemoryId =
      !selectedMemory &&
      !!currentMemoryIdParam &&
      processedMemoryParamRef.current !== currentMemoryIdParam;

    // Preserve active era in URL for consistency when sharing/reloading.
    params.set('era', String(activeMapEra));

    if (memoryDetailOpen && selectedMemory?.id) {
      params.set('memoryId', selectedMemory.id);
    } else if (!hasPendingIncomingMemoryId) {
      params.delete('memoryId');

      // Reset processed refs when leaving notebook mode so reopening via URL works
      // for the same memory ID in a later navigation.
      processedMemoryParamRef.current = null;
      cameraFocusedMemoryParamRef.current = null;
    }

    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `/map?${nextSearch}` : '/map';
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    isClient,
    activeMapEra,
    memoryDetailOpen,
    selectedMemory,
    selectedMemory?.id,
    router,
  ]);

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
    if (
      !mapReady ||
      !mapRef.current ||
      memories.length === 0 ||
      !showMemoryPins
    )
      return;

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
    mapReady,
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
    <div className="h-full w-full overflow-hidden bg-white">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <MapAnnouncementStrip announcements={MAP_ANNOUNCEMENTS} />

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div ref={mapContainerRef} className="h-full w-full" />

          <AddMemoryButton onClick={() => setAddMemoryOpen(true)} />

          <ExpandableToolbar
            onConfigureClick={isAdmin ? () => router.push('/admin') : undefined}
          />

          <GroupPanel
            open={groupModalOpen}
            onOpenChange={(isOpen) => {
              setGroupModalOpen(isOpen);
              if (isOpen) cancelPendingFlyTo();
            }}
          />

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

          {locationSelectionMode !== 'inactive' && (
            <MapLocationSelector
              mode={locationSelectionMode}
              onCancel={handleCancelMapSelection}
              onLocationSelected={handleLocationSelected}
              pendingSelection={pendingLocationSelection}
              mapRef={mapRef}
            />
          )}

          <LandmarkMemoriesPanel
            landmark={selectedLandmark}
            memoryCount={
              selectedLandmark ? (memoryCounts[selectedLandmark.id] ?? 0) : 0
            }
            onClose={() => setSelectedLandmark(null)}
          />

          {showFirstMemoryPrompt && (
            <MapFirstMemoryPrompt onAddMemory={() => setAddMemoryOpen(true)} />
          )}

          <MemoryDetailModal
            memory={selectedMemory}
            previousMemory={previousSelectedMemory}
            nextMemory={nextSelectedMemory}
            open={memoryDetailOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                closeNotebookView();
                return;
              }
              setMemoryDetailOpen(true);
              onMemoryDetailOpenStateChange?.(true);
            }}
            onMemoryDeleted={() => setSelectedMemory(null)}
            hasPrevious={selectedMemoryIndex > 0}
            hasNext={
              selectedMemoryIndex >= 0 &&
              selectedMemoryIndex < memories.length - 1
            }
            onPrevious={() => {
              if (previousSelectedMemory) {
                setSelectedMemory(previousSelectedMemory);
                flyToMemoryWithSequence(previousSelectedMemory);
              }
            }}
            onNext={() => {
              if (nextSelectedMemory) {
                setSelectedMemory(nextSelectedMemory);
                flyToMemoryWithSequence(nextSelectedMemory);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
