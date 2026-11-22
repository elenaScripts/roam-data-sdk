import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeDataset } from '../dist/index.js';

// Documentation artwork tooling only; these packages are not SDK dependencies
const require = process.env.ROAM_ASSET_MODULE_ROOT
  ? createRequire(join(resolve(process.env.ROAM_ASSET_MODULE_ROOT), 'package.json'))
  : createRequire(import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const basePath = join(root, 'docs/assets/sdk-overview.png');
const image = await sharp(basePath).metadata();
const width = 1000;
const height = 563;
const frameMs = 50;
const durationMs = 8000;
const background = await sharp(await readFile(basePath)).resize(width, height).png().toBuffer();
const frames = [];
const delays = [];
const snapshots = new Map([[1000, 'input'], [3400, 'processing'], [6400, 'result']]);
const previewDir = join(root, 'output/animation-review');
await mkdir(previewDir, { recursive: true });

const dataset = {
  schemaVersion: 1,
  petId: 'sample-pet',
  segments: [[
    { latitude: 0, longitude: 0, timestamp: 0 },
    { latitude: 0, longitude: 0.01, timestamp: 600_000 },
  ]],
};
const summary = summarizeDataset(dataset);
if (summary.distanceKm.toFixed(3) !== '1.112'
  || summary.durationMs !== 600_000 || summary.pointCount !== 2) {
  throw new Error('Overview values no longer match the SDK example');
}

const colors = { green: '#3f6242', orange: '#b96035', cream: '#f8f1e5', pill: '#e4e3d0' };
let shapes = [];
const clamp = value => Math.max(0, Math.min(1, value));
const progress = (time, start, end) => clamp((time - start) / (end - start));

// Invert the cubic's x component before calculating y (CSS ease-in-out token)
function bezier(value, x1, y1, x2, y2) {
  const cubic = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 18; index++) {
    const middle = (low + high) / 2;
    if (cubic(middle, x1, x2) < value) low = middle;
    else high = middle;
  }
  return cubic((low + high) / 2, y1, y2);
}
const easeOut = value => bezier(value, 0.23, 1, 0.32, 1);
const easeInOut = value => bezier(value, 0.77, 0, 0.175, 1);
function windowOpacity(time, start, end) {
  return easeOut(progress(time, start, start + 200)) * (1 - easeOut(progress(time, end - 200, end)));
}
function focusCard(x, y, w, h, opacity, color) {
  shapes.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32" fill="none" stroke="${color}" stroke-width="6" opacity="${opacity}"/>`);
}
function travelingDot(time, start, end, x1, x2) {
  if (time < start || time > end) return;
  const value = easeInOut(progress(time, start, end));
  shapes.push(`<g transform="translate(${x1 + (x2 - x1) * value} 549)"><circle r="12" fill="${colors.orange}" stroke="${colors.cream}" stroke-width="3"/></g>`);
}

for (let time = 0; time < durationMs; time += frameMs) {
  shapes = [];

  // Hold readable labels still; motion directs attention through the workflow
  focusCard(44, 303, 429, 493, windowOpacity(time, 0, 2200), colors.green);
  focusCard(533, 305, 584, 491, windowOpacity(time, 2300, 4600), colors.orange);
  focusCard(1179, 303, 449, 493, windowOpacity(time, 4700, 8000), colors.green);

  const sourceRows = [579, 642, 706];
  sourceRows.forEach((y, index) => {
    const opacity = windowOpacity(time, 200 + index * 500, 1000 + index * 500);
    shapes.push(`<rect x="145" y="${y - 32}" width="235" height="48" rx="10" fill="${colors.green}" opacity="${opacity * 0.14}"/>`);
  });

  travelingDot(time, 1900, 2500, 482, 526);
  [630, 825, 1010].forEach((x, index) => {
    const opacity = windowOpacity(time, 2400 + index * 650, 3300 + index * 650);
    shapes.push(`<rect x="${x - 45}" y="584" width="90" height="92" rx="18" fill="none" stroke="${colors.orange}" stroke-width="5" opacity="${opacity}"/>`);
  });
  travelingDot(time, 4400, 5000, 1127, 1173);

  // Reveal the original, accurate metrics after processing, staggered by 80 ms
  [410, 496, 583].forEach((y, index) => {
    const revealed = easeOut(progress(time, 5000 + index * 80, 5200 + index * 80));
    const reset = easeOut(progress(time, 7800, 8000));
    const hidden = 1 - revealed * (1 - reset);
    shapes.push(`<g opacity="${hidden}"><rect x="1218" y="${y}" width="376" height="75" rx="19" fill="${colors.pill}"/><text x="1406" y="${y + 52}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="44" fill="${colors.green}">—</text></g>`);
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${image.width} ${image.height}">${shapes.join('')}</svg>`;
  const frame = await sharp(background).composite([{ input: Buffer.from(svg) }]).ensureAlpha().raw().toBuffer();
  frames.push(frame);
  delays.push(frameMs);
  if (snapshots.has(time)) {
    await sharp(frame, { raw: { width, height, channels: 4 } }).png().toFile(join(previewDir, `${snapshots.get(time)}.png`));
  }
}

const target = join(root, 'docs/assets/sdk-workflow.gif');
await sharp(Buffer.concat(frames), {
  raw: { width, height: height * frames.length, channels: 4, pageHeight: height },
}).gif({ loop: 0, delay: delays, colours: 128, dither: 0, effort: 7 }).toFile(target);

const metadata = await sharp(target, { animated: true }).metadata();
if (metadata.pages < 2 || metadata.loop !== 0
  || metadata.delay.reduce((sum, value) => sum + value, 0) !== durationMs) {
  throw new Error('Expected a looping eight-second animation');
}
console.log(JSON.stringify({
  path: 'docs/assets/sdk-workflow.gif',
  width: metadata.width,
  height: metadata.pageHeight,
  frames: metadata.pages,
  durationMs,
  loop: metadata.loop,
}));
