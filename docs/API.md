# API reference

All functions are synchronous and operate on supplied values. The SDK performs no network requests or file I/O.

## Data format

```ts
interface Coordinates {
  latitude: number;  // -90 through 90
  longitude: number; // -180 through 180
}

interface LocationPoint extends Coordinates {
  timestamp: number; // Integer Unix milliseconds, from 0 through 8640000000000000
  accuracyMeters?: number; // Nonnegative finite number, at most Number.MAX_SAFE_INTEGER
}

interface PetDataset {
  schemaVersion: 1;
  petId: string; // Nonempty after trimming; at most 128 characters
  petName?: string; // Nonempty after trimming; at most 100 characters
  batteryPercent?: number; // 0 through 100, including fractional values
  segments: LocationPoint[][];
}
```

`schemaVersion`, `petId`, and `segments` are required. Labels are trimmed. Optional fields must be omitted when unavailable; explicit `null` or `undefined` values are invalid. Unknown dataset and point fields are rejected. Empty segments are valid. Points in a segment must have nondecreasing timestamps; equal timestamps are allowed.

This is the library's own data format. Exports from other software may need conversion before validation.

## Functions

| Function | Result |
| --- | --- |
| `validateCoordinates(input: unknown)` | A new `Coordinates` object with validated numeric latitude and longitude |
| `validateDataset(input: unknown)` | A new `PetDataset`, including copied segments and points |
| `parseDataset(json: string)` | A validated `PetDataset` parsed from JSON |
| `serializeDataset(dataset: PetDataset)` | A two-space-indented JSON string after validation |
| `distanceKm(start: Coordinates, end: Coordinates)` | Spherical great-circle distance in kilometers |
| `summarizeDataset(dataset: PetDataset)` | A validated dataset's `DatasetSummary` |

`validateCoordinates` selects latitude and longitude and permits additional properties, so a `LocationPoint` can also be passed to `distanceKm`. Dataset and point validation uses the stricter schema above.

All validation failures raise `TypeError`. Error messages describe the constraint and do not repeat input values. Invalid JSON produces `Invalid JSON input`, without embedding the original JSON or parser error.

## Summaries

```ts
interface DatasetSummary {
  segmentCount: number;
  pointCount: number;
  distanceKm: number;
  durationMs: number;
  firstTimestamp: number | null;
  lastTimestamp: number | null;
}
```

`segmentCount` includes empty segments. Empty histories have zero distance, duration, and point count, with `null` timestamps. A single-point segment contributes no distance or duration.

Distances use the haversine formula with a spherical Earth radius of 6371 km. Adjacent points are joined only within the same supplied segment. Durations sum each segment's last timestamp minus its first timestamp. Gaps between segments are excluded; overlapping segment spans are counted separately. First and last timestamps are the earliest and latest points across all segments.

The SDK preserves input order and does not mutate the supplied dataset. It does not infer movement sessions or filter implausible measurements.
