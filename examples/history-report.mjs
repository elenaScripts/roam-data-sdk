import { parseDataset, serializeDataset, summarizeDataset } from 'roam-data-sdk';

// Synthetic data in the SDK format, as supplied by an application's import step
const jsonText = JSON.stringify({
  schemaVersion: 1,
  petId: 'sample-pet',
  segments: [
    [
      { latitude: 0, longitude: 0, timestamp: 0 },
      { latitude: 0, longitude: 0.01, timestamp: 600_000 },
    ],
    [
      { latitude: 0, longitude: 1, timestamp: 3_600_000 },
      { latitude: 0, longitude: 1.01, timestamp: 4_200_000 },
    ],
  ],
});

const dataset = parseDataset(jsonText);

// JSON can be passed back to application storage without SDK file or network I/O
const archivedJson = serializeDataset(dataset);
const restoredDataset = parseDataset(archivedJson);
const summary = summarizeDataset(restoredDataset);

console.log(JSON.stringify({
  segmentCount: summary.segmentCount,
  pointCount: summary.pointCount,
  distanceKm: Number(summary.distanceKm.toFixed(3)),
  recordedMinutes: summary.durationMs / 60_000,
}, null, 2));
