import { validateDataset, summarizeDataset } from 'roam-data-sdk';

// Synthetic coordinates and timestamps. This example has no external services.
const dataset = validateDataset({
  schemaVersion: 1,
  petId: 'sample-pet',
  petName: 'Sample companion',
  batteryPercent: 87,
  segments: [[
    { latitude: 0, longitude: 0, timestamp: 0 },
    { latitude: 0, longitude: 0.01, timestamp: 600_000 },
  ]],
});

console.log(summarizeDataset(dataset));
