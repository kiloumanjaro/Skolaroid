import { LANDMARKS, type Landmark } from '@/lib/constants/landmarks';

/** Campus bounds — matches maxBounds from map.tsx */
export const CAMPUS_BOUNDS = {
  sw: { lng: 123.89, lat: 10.32 },
  ne: { lng: 123.91, lat: 10.33 },
};

/**
 * Calculate the distance between two geographic points using the Haversine formula.
 * @returns Distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest landmark to a given coordinate.
 */
export function findNearestLandmark(coord: {
  latitude: number;
  longitude: number;
}): { landmark: Landmark; distance: number } {
  let nearest: Landmark = LANDMARKS[0];
  let minDistance = Infinity;

  for (const landmark of LANDMARKS) {
    const distance = haversineDistance(
      coord.latitude,
      coord.longitude,
      landmark.coordinates[1],
      landmark.coordinates[0]
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = landmark;
    }
  }

  return { landmark: nearest, distance: minDistance };
}

/**
 * Generate an auto-name for a custom location based on nearest landmark.
 */
export function generateLocationName(
  latitude: number,
  longitude: number
): string {
  const { landmark } = findNearestLandmark({ latitude, longitude });
  return `Near ${landmark.name}`;
}

/**
 * Check if coordinates are within campus bounds.
 */
export function isWithinCampusBounds(
  latitude: number,
  longitude: number
): boolean {
  return (
    longitude >= CAMPUS_BOUNDS.sw.lng &&
    longitude <= CAMPUS_BOUNDS.ne.lng &&
    latitude >= CAMPUS_BOUNDS.sw.lat &&
    latitude <= CAMPUS_BOUNDS.ne.lat
  );
}
