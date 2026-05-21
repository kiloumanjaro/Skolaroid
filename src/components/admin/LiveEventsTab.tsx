'use client';

import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, X, MapPin, CalendarRange } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LiveEvent {
  id: string;
  name: string;
  description?: string | null;
  bannerColor: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  location: { latitude: number; longitude: number; buildingName: string };
}

interface LiveEventsTabProps {
  searchQuery: string;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function useActiveEvents() {
  return useQuery<{ success: boolean; data: LiveEvent[] }>({
    queryKey: ['live-events', 'admin-all'],
    queryFn: () =>
      fetch('/api/prisma/live-event/get-active').then((r) => r.json()),
  });
}

function useDeactivateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/prisma/live-event/${id}/deactivate`, {
        method: 'PATCH',
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] });
    },
  });
}

function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/prisma/live-event/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] });
    },
  });
}

// Mini Mapbox map for picking event location
function LocationPicker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [123.8986, 10.3224],
      zoom: 16,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      onSelect(lat, lng);
    });

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full border border-border"
      style={{ cursor: 'crosshair' }}
    />
  );
}

export function LiveEventsTab({ searchQuery }: LiveEventsTabProps) {
  const { data, isLoading, error } = useActiveEvents();
  const deactivate = useDeactivateEvent();
  const createEvent = useCreateEvent();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerColor, setBannerColor] = useState('#3B82F6');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);

  const events = (data?.data ?? []).filter((e) =>
    searchQuery
      ? e.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!coords) {
      setFormError('Click a location on the map to set the event pin.');
      return;
    }

    const result = await createEvent.mutateAsync({
      name,
      description: description || undefined,
      bannerColor,
      startAt,
      endAt,
      latitude: coords.lat,
      longitude: coords.lng,
    });

    if (!result.success) {
      setFormError(result.message ?? 'Failed to create event');
      return;
    }

    setShowForm(false);
    setName('');
    setDescription('');
    setBannerColor('#3B82F6');
    setStartAt('');
    setEndAt('');
    setCoords(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Active Live Events
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 border-2 border-border bg-skolaroid-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          {showForm ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {showForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border-2 border-border bg-card p-4"
        >
          <h3 className="text-sm font-semibold text-foreground">
            New Live Event
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Event Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder="e.g. Freshmen Orientation 2026"
                className="w-full border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Banner Color *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bannerColor}
                  onChange={(e) => setBannerColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer border border-border p-0.5"
                  style={{ borderRadius: 0 }}
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {bannerColor}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Start *
              </label>
              <input
                required
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                End *
              </label>
              <input
                required
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Optional: brief description of the event"
              className="w-full resize-none border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              style={{ borderRadius: 0 }}
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Location — click the map to set the pin *
            </label>
            {coords && (
              <p className="text-[10px] text-muted-foreground">
                Selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <LocationPicker onSelect={(lat, lng) => setCoords({ lat, lng })} />
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={createEvent.isPending}
            className="flex items-center gap-1.5 border-2 border-border bg-skolaroid-blue px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {createEvent.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {createEvent.isPending ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      )}

      {/* Event List */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading events…
        </div>
      )}

      {error && <p className="text-sm text-red-600">Failed to load events.</p>}

      {!isLoading && events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No active events.{' '}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="underline hover:text-foreground"
            >
              Create one
            </button>
          )}
        </p>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 border-2 border-border bg-card p-3"
          >
            {/* Color swatch */}
            <div
              className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-border"
              style={{ backgroundColor: event.bannerColor }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {event.name}
                </span>
                {event.isActive && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    Active
                  </span>
                )}
              </div>

              {event.description && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {event.description}
                </p>
              )}

              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarRange className="h-3 w-3 shrink-0" />
                {formatDateTime(event.startAt)} – {formatDateTime(event.endAt)}
              </div>
            </div>

            <button
              onClick={() => deactivate.mutate(event.id)}
              disabled={deactivate.isPending}
              className="shrink-0 border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              {deactivate.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Deactivate'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
