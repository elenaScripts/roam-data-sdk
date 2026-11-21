import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distanceKm, parseDataset, serializeDataset, summarizeDataset,
  validateCoordinates, validateDataset,
} from '../dist/index.js';

const point = (longitude, timestamp = 0) => ({ latitude: 0, longitude, timestamp });
const data = (segments = []) => ({ schemaVersion: 1, petId: 'sample-pet', segments });

test('parsing and serialization preserve the documented optional fields', () => {
  const input = { ...data([[{ ...point(1), accuracyMeters: 0 }]]), petName: 'Sample companion', batteryPercent: 0 };
  assert.deepEqual(parseDataset(serializeDataset(input)), input);
  assert.equal(validateDataset({ ...data(), batteryPercent: 100 }).batteryPercent, 100);
});

test('validation returns an independent copy and normalizes labels', () => {
  const input = { ...data([[point(1)]]), petId: ' sample-pet ', petName: ' Sample companion ' };
  const result = validateDataset(input);
  input.segments[0][0].longitude = 2;
  assert.equal(result.petId, 'sample-pet');
  assert.equal(result.petName, 'Sample companion');
  assert.equal(result.segments[0][0].longitude, 1);
});

test('invalid JSON errors do not echo source text', () => {
  const marker = 'synthetic-private-marker';
  assert.throws(() => parseDataset(`{"value":"${marker}"`), error => {
    assert.equal(error.message, 'Invalid JSON input');
    return !error.message.includes(marker);
  });
});

test('schema and unknown fields are checked at dataset and point boundaries', () => {
  for (const input of [null, [], {}, { ...data(), schemaVersion: 2 }, { ...data(), extra: true }, data([[{ ...point(0), extra: true }]])]) {
    assert.throws(() => validateDataset(input), TypeError);
  }
  assert.throws(() => validateDataset(data(new Array(1))), TypeError);
  assert.throws(() => validateDataset(data([new Array(1)])), TypeError);
});

test('coordinates reject out-of-range, non-finite, and string values', () => {
  for (const [latitude, longitude] of [[91, 0], [-91, 0], [0, 181], [0, -181], [NaN, 0], [0, Infinity], ['0', 0]]) {
    assert.throws(() => validateCoordinates({ latitude, longitude }), TypeError);
  }
  assert.deepEqual(validateCoordinates({ latitude: -90, longitude: 180 }), { latitude: -90, longitude: 180 });
});

test('timestamps use integer milliseconds and preserve explicit ordering', () => {
  for (const timestamp of [-1, 0.5, Infinity, 8_640_000_000_000_001]) {
    assert.throws(() => validateDataset(data([[point(0, timestamp)]])), TypeError);
  }
  assert.throws(() => validateDataset(data([[point(0, 2), point(1, 1)]])), /chronological/);
  assert.equal(validateDataset(data([[point(0, 0), point(1, 0)]])).segments[0][0].timestamp, 0);
});

test('optional metadata rejects missing values, invalid ranges, and empty names', () => {
  for (const override of [{ petId: '' }, { petName: ' ' }, { petName: undefined }, { batteryPercent: undefined }, { batteryPercent: -1 }, { batteryPercent: 101 }]) {
    assert.throws(() => validateDataset({ ...data(), ...override }), TypeError);
  }
  assert.throws(() => validateDataset(data([[{ ...point(0), accuracyMeters: -1 }]])), TypeError);
});

test('empty and single-point histories have defined zero-distance summaries', () => {
  assert.deepEqual(summarizeDataset(data()), {
    segmentCount: 0, pointCount: 0, distanceKm: 0, durationMs: 0,
    firstTimestamp: null, lastTimestamp: null,
  });
  const summary = summarizeDataset(data([[], [point(0, 123)]]));
  assert.equal(summary.segmentCount, 2);
  assert.equal(summary.pointCount, 1);
  assert.equal(summary.distanceKm, 0);
  assert.equal(summary.durationMs, 0);
  assert.equal(summary.firstTimestamp, 123);
  assert.equal(summary.lastTimestamp, 123);
});

test('one degree along the equator has the known spherical distance', () => {
  assert.ok(Math.abs(distanceKm(point(0), point(1)) - 111.194926645) < 0.000001);
  assert.equal(distanceKm(point(5), point(5)), 0);
});

test('antimeridian and antipodal distances remain finite and use the short arc', () => {
  assert.ok(Math.abs(distanceKm(point(179), point(-179)) - 222.389853289) < 0.000001);
  assert.ok(Math.abs(distanceKm(point(0), point(180)) - 20_015.086796021) < 0.000001);
});

test('summaries exclude distance and elapsed time across segment boundaries', () => {
  const input = data([[point(0, 0), point(1, 1000)], [point(100, 3_600_000), point(101, 3_602_000)]]);
  const before = structuredClone(input);
  const summary = summarizeDataset(input);
  assert.equal(summary.pointCount, 4);
  assert.equal(summary.segmentCount, 2);
  assert.ok(Math.abs(summary.distanceKm - 222.389853289) < 0.000001);
  assert.equal(summary.durationMs, 3000);
  assert.equal(summary.firstTimestamp, 0);
  assert.equal(summary.lastTimestamp, 3_602_000);
  assert.deepEqual(input, before);
});
