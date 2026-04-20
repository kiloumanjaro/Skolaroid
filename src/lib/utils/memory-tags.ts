import { prisma } from '@/lib/prisma';
import { findNearestLandmark } from '@/lib/utils/map-utils';

export async function generateAutoTags(
  locationId: string,
  memoryDate?: Date
): Promise<string[]> {
  const autoTags: string[] = [];

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      buildingName: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!location) {
    throw new Error(`Location with ID ${locationId} not found`);
  }

  const { buildingName, latitude, longitude } = location;

  if (buildingName) {
    autoTags.push(buildingName);
  } else {
    const nearest = findNearestLandmark({ latitude, longitude });
    if (nearest) {
      autoTags.push(`Near ${nearest.landmark.name}`);
    }
  }

  const referenceYear = memoryDate
    ? memoryDate.getFullYear()
    : new Date().getFullYear();
  const decade = Math.floor(referenceYear / 10) * 10;
  autoTags.push(`${decade}s`);

  if (memoryDate) {
    autoTags.push(`${referenceYear}`);
  }

  return autoTags;
}
