'use client';

import { useEffect, useCallback, useState } from 'react';
import type {
  LocationSelectionMode,
  MapLocationSelection,
} from '@/lib/types/map';
import {
  isWithinCampusBounds,
  generateLocationName,
} from '@/lib/utils/map-utils';

interface MapLocationSelectorProps {
  mode: LocationSelectionMode;
  onCancel: () => void;
  onLocationSelected: (selection: MapLocationSelection) => void;
  pendingSelection: MapLocationSelection | null;
  mapRef?: React.RefObject<mapboxgl.Map | null>;
}

export function MapLocationSelector({
  mode,
  onCancel,
  onLocationSelected,
  mapRef,
}: MapLocationSelectorProps) {
  const [outOfBoundsError, setOutOfBoundsError] = useState(false);

  // Handle map click for custom coordinate mode
  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      if (mode !== 'custom') return;

      const { lng, lat } = e.lngLat;

      if (!isWithinCampusBounds(lat, lng)) {
        setOutOfBoundsError(true);
        setTimeout(() => setOutOfBoundsError(false), 3000);
        return;
      }

      const buildingName = generateLocationName(lat, lng);

      onLocationSelected({
        mode: 'custom',
        customLocation: {
          latitude: lat,
          longitude: lng,
          buildingName,
        },
      });
    },
    [mode, onLocationSelected]
  );

  // Handle mouse move to update cursor based on bounds
  const handleMouseMove = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      if (mode !== 'custom') return;
      const map = mapRef?.current;
      if (!map) return;

      const { lng, lat } = e.lngLat;
      const inBounds = isWithinCampusBounds(lat, lng);
      map.getCanvas().style.cursor = inBounds ? 'crosshair' : 'not-allowed';
    },
    [mode, mapRef]
  );

  // Attach click and mousemove handlers to map for custom mode
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || mode !== 'custom') return;

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, mode, handleMapClick, handleMouseMove]);

  // ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Auto-timeout: restore modal after 2 minutes of inactivity
  useEffect(() => {
    const timer = setTimeout(
      () => {
        onCancel();
      },
      2 * 60 * 1000
    );
    return () => clearTimeout(timer);
  }, [onCancel]);

  return (
    <>
      {/* Instruction bar */}
      <div className="absolute left-3 right-3 top-3 z-20 sm:left-1/2 sm:right-auto sm:top-4 sm:-translate-x-1/2">
        <div className="flex flex-wrap items-center justify-center gap-2 border-2 border-border bg-card px-4 py-3 text-center shadow-[3px_3px_0px_0px_#2d2d2d] sm:flex-nowrap sm:justify-start sm:gap-3 sm:px-5">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-skolaroid-blue" />
          <span className="text-sm font-medium text-foreground">
            {mode === 'landmark'
              ? 'Click a landmark on the map to select it'
              : 'Click anywhere on the campus map to place a pin'}
          </span>
          <button
            onClick={onCancel}
            className="ml-2 bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
          >
            Cancel
          </button>
          <kbd className="hidden bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>
      </div>

      {/* Out-of-bounds error toast */}
      {outOfBoundsError && (
        <div className="absolute left-3 right-3 top-24 z-20 duration-200 animate-in fade-in slide-in-from-top-2 sm:left-1/2 sm:right-auto sm:top-20 sm:-translate-x-1/2">
          <div className="border-2 border-red-200 bg-red-50 px-4 py-2 shadow-[3px_3px_0px_0px_#2d2d2d]">
            <p className="text-sm font-medium text-red-700">
              Please select a location within campus
            </p>
          </div>
        </div>
      )}
    </>
  );
}
