import type { Coordinates, DatasetSummary, PetDataset } from './types.js';
import { validateCoordinates, validateDataset } from './validation.js';

/** Spherical great-circle estimate using a mean Earth radius of 6371 km. */
export function distanceKm(start: Coordinates, end: Coordinates): number {
  const a = validateCoordinates(start);
  const b = validateCoordinates(end);
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const h = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude))
    * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return 12_742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

/** Summarize explicit segments without sorting, inferring walks, or filling gaps. */
export function summarizeDataset(input: PetDataset): DatasetSummary {
  const dataset = validateDataset(input);
  const result: DatasetSummary = {
    segmentCount: dataset.segments.length,
    pointCount: 0,
    distanceKm: 0,
    durationMs: 0,
    firstTimestamp: null,
    lastTimestamp: null,
  };
  for (const segment of dataset.segments) {
    result.pointCount += segment.length;
    const first = segment[0];
    const last = segment.at(-1);
    if (!first || !last) continue;
    result.durationMs += last.timestamp - first.timestamp;
    result.firstTimestamp = Math.min(result.firstTimestamp ?? first.timestamp, first.timestamp);
    result.lastTimestamp = Math.max(result.lastTimestamp ?? last.timestamp, last.timestamp);
    for (let index = 1; index < segment.length; index++) {
      result.distanceKm += distanceKm(segment[index - 1]!, segment[index]!);
    }
  }
  return result;
}
