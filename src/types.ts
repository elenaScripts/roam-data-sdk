/** Geographic coordinates in decimal degrees. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint extends Coordinates {
  /** Unix time in milliseconds. */
  timestamp: number;
  accuracyMeters?: number;
}

/** An explicit segment boundary prevents distances being joined across gaps. */
export interface PetDataset {
  schemaVersion: 1;
  petId: string;
  petName?: string;
  batteryPercent?: number;
  segments: LocationPoint[][];
}

export interface DatasetSummary {
  segmentCount: number;
  pointCount: number;
  distanceKm: number;
  /** Sum of segment spans, excluding gaps between segments. */
  durationMs: number;
  firstTimestamp: number | null;
  lastTimestamp: number | null;
}
