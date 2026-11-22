# Use cases

Roam data SDK is for developers working with pet location data that their application already has, such as saved dog walks. It accepts its own documented data format and runs locally in Node.js. It supplies data-processing functions; your application provides storage, imports, and the user interface.

## Report on saved dog walks

**Use it when:** you have recorded points grouped into separate outings or other explicit segments and want a distance and duration report.

Call `summarizeDataset(dataset)` to get approximate distance, recorded duration, segment count, point count, and the earliest and latest timestamps. Distances connect adjacent points only within each segment. Recorded duration is the sum of segment spans; it does not measure time spent moving.

The [history report example](../examples/history-report.mjs) contains two synthetic 10-minute segments with a 50-minute gap between them. After building the SDK, run:

```sh
node examples/history-report.mjs
```

Output:

```json
{
  "segmentCount": 2,
  "pointCount": 4,
  "distanceKm": 2.224,
  "recordedMinutes": 20
}
```

The gap adds no connecting distance or duration. The SDK does not decide where an outing starts or ends; you supply those boundaries. Distance is a spherical estimate and depends on the quality and frequency of the supplied measurements.

## Validate imports and save consistent JSON

**Use it when:** your application receives JSON and needs to check its shape before using or storing it.

Use `parseDataset(jsonText)` to parse and validate JSON. Use `validateDataset(value)` for an object already in memory. They reject invalid coordinates, unsupported fields, and timestamps that run backwards within a segment. A successful result is a validated copy of the data.

```js
import { parseDataset, serializeDataset } from 'roam-data-sdk';

// jsonText is supplied by your application's import step
const dataset = parseDataset(jsonText);
const normalizedJson = serializeDataset(dataset);
```

Your application can save `normalizedJson` as an archive and read it again later. The SDK performs no file I/O. An export from another tool needs conversion to the [SDK data format](API.md#data-format) before validation; there are no built-in vendor importers.

## Build a location-history dashboard

**Use it when:** you are building a Node.js application that displays a saved route and a few summary values.

Validate the dataset, calculate its summary, and pass the values to your own view. For example, `summary.distanceKm` can populate a distance label, `summary.pointCount` can populate a sample count, and the original segments can supply points to a separate map renderer.

```js
import { validateDataset, summarizeDataset } from 'roam-data-sdk';

// importedValue is an object supplied by your application
const dataset = validateDataset(importedValue);
const summary = summarizeDataset(dataset);

const viewModel = {
  distanceLabel: `${summary.distanceKm.toFixed(2)} km`,
  durationLabel: `${Math.round(summary.durationMs / 60_000)} min`,
  pointCount: summary.pointCount,
  segments: dataset.segments,
};
```

The interface, charts, and map rendering belong to your application. The SDK does not supply map tiles, improve GPS accuracy, fetch fresh locations, or run a web server. Validate before display and keep any map-provider configuration in your application.

## Develop features with synthetic data

**Use it when:** you want to develop a report, import flow, or dashboard without connecting a tracker or using personal location history.

Start with the [two-point example](../examples/demo.mjs) or [segmented report example](../examples/history-report.mjs), then vary the supplied data to exercise empty histories, separate segments, or validation errors. All included coordinates, timestamps, and pet labels are synthetic.

```sh
npm run demo
```

The core has no runtime dependencies, network requests, or background jobs. Results depend on the supplied data, making these examples useful for local development and automated checks.

## Choose the right tool

Use Roam data SDK for validation, JSON round trips, and summaries of supplied location data. Features such as live tracking, account sign-in, automatic outing detection, GPS smoothing, and map display require other application code or services.

See the [API reference](API.md) for function signatures, limits, and distance and duration semantics.
