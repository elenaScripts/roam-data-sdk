import type { Coordinates, LocationPoint, PetDataset } from './types.js';

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function fields(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw new TypeError(`${label} contains unsupported fields`);
  }
}

function number(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`${label} must be a finite number between ${min} and ${max}`);
  }
  return value;
}

function text(value: unknown, maxLength: number, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new TypeError(`${label} must be a nonempty string of at most ${maxLength} characters`);
  }
  return value.trim();
}

export function validateCoordinates(input: unknown): Coordinates {
  const value = record(input, 'Coordinates');
  return {
    latitude: number(value.latitude, -90, 90, 'latitude'),
    longitude: number(value.longitude, -180, 180, 'longitude'),
  };
}

function point(input: unknown): LocationPoint {
  const value = record(input, 'Point');
  fields(value, ['latitude', 'longitude', 'timestamp', 'accuracyMeters'], 'Point');
  const timestamp = number(value.timestamp, 0, 8_640_000_000_000_000, 'timestamp');
  if (!Number.isInteger(timestamp)) throw new TypeError('timestamp must be an integer in milliseconds');
  const result: LocationPoint = { ...validateCoordinates(value), timestamp };
  if (Object.hasOwn(value, 'accuracyMeters')) {
    result.accuracyMeters = number(value.accuracyMeters, 0, Number.MAX_SAFE_INTEGER, 'accuracyMeters');
  }
  return result;
}

/** Validate and copy the documented dataset format. Unknown fields are rejected. */
export function validateDataset(input: unknown): PetDataset {
  const value = record(input, 'Dataset');
  fields(value, ['schemaVersion', 'petId', 'petName', 'batteryPercent', 'segments'], 'Dataset');
  if (value.schemaVersion !== 1) throw new TypeError('schemaVersion must be 1');
  if (!Array.isArray(value.segments)) throw new TypeError('segments must be an array');
  const segments = Array.from(value.segments, (inputSegment: unknown): LocationPoint[] => {
    if (!Array.isArray(inputSegment)) throw new TypeError('Each segment must be an array');
    const segment = Array.from(inputSegment, point);
    for (let index = 1; index < segment.length; index++) {
      if (segment[index]!.timestamp < segment[index - 1]!.timestamp) {
        throw new TypeError('Points in each segment must be in chronological order');
      }
    }
    return segment;
  });
  const result: PetDataset = {
    schemaVersion: 1,
    petId: text(value.petId, 128, 'petId'),
    segments,
  };
  if (Object.hasOwn(value, 'petName')) result.petName = text(value.petName, 100, 'petName');
  if (Object.hasOwn(value, 'batteryPercent')) {
    result.batteryPercent = number(value.batteryPercent, 0, 100, 'batteryPercent');
  }
  return result;
}

/** Parse JSON without including its contents in syntax error messages. */
export function parseDataset(json: string): PetDataset {
  if (typeof json !== 'string') throw new TypeError('JSON input must be a string');
  let input: unknown;
  try { input = JSON.parse(json) as unknown; }
  catch { throw new TypeError('Invalid JSON input'); }
  return validateDataset(input);
}

/** Serialize a validated copy. The caller decides where to store the string. */
export function serializeDataset(dataset: PetDataset): string {
  return JSON.stringify(validateDataset(dataset), null, 2);
}
