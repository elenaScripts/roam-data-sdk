import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { ApngEncoder } from './apng.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeDataset } from '../dist/index.js';

// Sharp is optional artwork tooling, separate from the SDK
const require = process.env.ROAM_ASSET_MODULE_ROOT
  ? createRequire(join(resolve(process.env.ROAM_ASSET_MODULE_ROOT), 'package.json'))
  : createRequire(import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const assets = join(root, 'docs/assets');
const review = join(root, 'output/animation-review');
await mkdir(review, { recursive: true });
const width = 2000;
const height = 1200;
const gifWidth = 1000;
const gifHeight = 600;
const durationMs = 8000;
const frameMs = 50;
const previewOnly = process.argv.includes('--preview');
const summary = summarizeDataset({
  schemaVersion: 1,
  petId: 'sample-pet',
  segments: [[
    { latitude: 0, longitude: 0, timestamp: 0 },
    { latitude: 0, longitude: 0.01, timestamp: 600_000 },
  ]],
});
if (summary.distanceKm.toFixed(3) !== '1.112'
  || summary.durationMs !== 600_000 || summary.pointCount !== 2) {
  throw new Error('Overview values no longer match the SDK example');
}

const c = {
  paper: '#1c2b43', ink: '#f2ecdc', muted: '#c6c9c6',
  side: '#b4b9b6', face: '#d9d6c7', amber: '#d6b375',
};
const clamp = value => Math.max(0, Math.min(1, value));
const progress = (time, start, end) => clamp((time - start) / (end - start));
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
const pulse = (time, start, end) =>
  easeOut(progress(time, start, start + 200)) * (1 - easeOut(progress(time, end - 200, end)));
const pointOnCurve = (t, points) => [0, 1].map(axis =>
  (1 - t) ** 3 * points[0][axis] + 3 * (1 - t) ** 2 * t * points[1][axis]
  + 3 * (1 - t) * t ** 2 * points[2][axis] + t ** 3 * points[3][axis]);
const words = [[80, 'Validate'], [210, 'Measure'], [350, 'Summarize']];
const walkCurve = [[700, 478], [820, 497], [1120, 458], [1255, 478]];
const dogFrames = JSON.parse(await readFile(join(assets, 'dog-run-frames.json'), 'utf8')).poses;
const dogCycleMs = 1000;
if (dogFrames.length !== 10 || dogFrames.some(frame => !/^[MQZ0-9., \\-]+$/.test(frame.path))) {
  throw new Error('Expected ten prepared dog silhouettes');
}

function scene() {
  return `
<defs></defs>
<rect width="1400" height="840" fill="${c.paper}"/>
<g font-family="Avenir Next, Futura, DejaVu Sans, sans-serif" font-weight="500" fill="${c.ink}">
  <text x="80" y="117" font-size="27">Offline tools for</text>
  <text x="80" y="153" font-size="27">dog location data</text>
  <g font-size="22" fill="${c.muted}">
    ${words.map(([x, word]) => `<text x="${x}" y="244">${word}</text>`).join('')}
  </g>
  <text x="76" y="632" font-size="119" font-weight="500" letter-spacing="-5">Roam</text>
  <text x="80" y="709" font-size="61" font-weight="500" letter-spacing="-2">data SDK</text>
  <text x="80" y="784" font-size="18" fill="${c.muted}">TypeScript / Node.js</text>
</g>
<text x="80" y="285" font-family="DejaVu Sans Mono, monospace" font-size="20" fill="${c.muted}">summarizeDataset(data)</text>
<path d="M700 478 C820 497 1120 458 1255 478" fill="none" stroke="${c.muted}" stroke-width="1.5" opacity=".55"/>
<circle cx="700" cy="478" r="4" fill="${c.muted}"/>
<g transform="translate(1255 478) scale(.65)">
  <path d="M0 0 C-4 -6 -19 -21 -19 -34 C-19 -60 19 -60 19 -34 C19 -21 4 -6 0 0Z" fill="${c.amber}"/>
  <circle cx="0" cy="-35" r="7" fill="${c.paper}"/>
</g>
<g font-family="Avenir Next, DejaVu Sans, sans-serif" font-weight="500" font-size="18" fill="${c.muted}">
  <text x="965" y="553">Synthetic walk example</text>
  <text x="965" y="629">Estimated distance</text>
  <text x="965" y="720">Recorded duration</text>
</g>`;
}

function dog(time, still = false) {
  const index = still ? 6 : Math.floor((time % dogCycleMs) / (dogCycleMs / dogFrames.length));
  return `<g transform="translate(650 -30) scale(1.6)"><path d="${dogFrames[index].path}" fill="${c.ink}" fill-rule="evenodd"/></g>`;
}

function motion(time, still = false) {
  const reset = 1 - easeOut(progress(time, 7800, 8000));
  const values = [
    [965, 604, summary.distanceKm.toFixed(3) + ' km', 45],
    [965, 695, summary.durationMs / 60_000 + ' min', 45],
    [965, 778, summary.pointCount + ' supplied points', 24],
  ].map(([x, y, text, size], index) => {
    const opacity = still ? 1 : easeOut(progress(time, 5100 + index * 80, 5300 + index * 80)) * reset;
    return `<g font-family="Avenir Next, DejaVu Sans, sans-serif" font-size="${size}" font-weight="500" fill="${c.ink}"><text x="${x}" y="${y}" opacity="${opacity}">${text}</text><text x="${x}" y="${y}" opacity="${1 - opacity}">—</text></g>`;
  }).join('\n');
  const highlights = words.map(([x, word], index) => {
    const opacity = still ? 0 : pulse(time, 1900 + index * 750, 2900 + index * 750);
    return `<text x="${x}" y="244" font-family="Avenir Next, DejaVu Sans, sans-serif" font-size="22" font-weight="500" fill="${c.ink}" opacity="${opacity}">${word}</text>`;
  }).join('\n');
  const routePosition = pointOnCurve(easeInOut(progress(time, 300, 7300)), walkCurve);
  const routeOpacity = still ? 0 : pulse(time, 100, 7800);
  const routeDot = `<circle cx="${routePosition[0]}" cy="${routePosition[1]}" r="5" fill="${c.amber}" opacity="${routeOpacity}"/>`;
  return dog(time, still) + routeDot + highlights + values;
}

function svg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1400 840"><title>Roam data SDK workflow</title><desc>An illustrated dog runs above a schematic location trail. Roam validates and summarizes supplied location data. The synthetic walk example has two points, an estimated distance of 1.112 km, and a ten-minute segment span.</desc>${content}</svg>`;
}

const backgroundScene = scene();
const posterSvg = svg(backgroundScene + motion(6400, true));
await writeFile(join(assets, 'sdk-overview.svg'), posterSvg.replace(/[ \t]+$/gm, '') + '\n');
await sharp(Buffer.from(posterSvg)).png().toFile(join(assets, 'sdk-overview.png'));
const background = await sharp(Buffer.from(svg(backgroundScene))).png().toBuffer();
const snapshots = new Map([[0, 'contact'], [200, 'collected'], [400, 'push'], [600, 'flight'], [1000, 'input'], [3400, 'processing'], [6400, 'result']]);
const frames = [];
const delays = [];
const expectedHashes = [];
const apng = previewOnly ? null : new ApngEncoder(width, height, durationMs / frameMs, frameMs);
let previousRaw;
for (let time = 0; time < durationMs; time += frameMs) {
  if (previewOnly && !snapshots.has(time)) continue;
  // Whole-body running poses keep the paws and tail part of one coherent silhouette
  const overlay = svg('<defs>' + backgroundScene.split('<defs>')[1].split('</defs>')[0] + '</defs>' + motion(time));
  if (/NaN|Infinity/.test(overlay)) throw new Error('Invalid dog pose coordinates');
  const raw = await sharp(background).composite([{ input: Buffer.from(overlay) }]).ensureAlpha().raw().toBuffer();
  if (!previewOnly) {
    expectedHashes.push(createHash('sha256').update(raw).digest('hex'));
    let patch = raw;
    if (previousRaw) {
      patch = Buffer.allocUnsafe(raw.length);
      const current = new Uint32Array(raw.buffer, raw.byteOffset, raw.length / 4);
      const previous = new Uint32Array(previousRaw.buffer, previousRaw.byteOffset, previousRaw.length / 4);
      const changed = new Uint32Array(patch.buffer, patch.byteOffset, patch.length / 4);
      for (let index = 0; index < current.length; index++) changed[index] = current[index] === previous[index] ? 0 : current[index];
    }
    const png = await sharp(patch, { raw: { width, height, channels: 4 } })
      .png({ palette: false, compressionLevel: 7, adaptiveFiltering: true }).toBuffer();
    apng.addFrame(png);
    previousRaw = raw;
    frames.push(await sharp(raw, { raw: { width, height, channels: 4 } }).resize(gifWidth, gifHeight).raw().toBuffer());
    delays.push(frameMs);
  }
  if (snapshots.has(time)) await sharp(raw, { raw: { width, height, channels: 4 } }).png().toFile(join(review, snapshots.get(time) + '.png'));
}
if (previewOnly) {
  console.log('Rendered still poster and three review frames');
} else {
  const animatedPng = apng.finish();
  await writeFile(join(assets, 'sdk-workflow.png'), animatedPng);
  await writeFile(join(review, 'expected-frame-hashes.json'), JSON.stringify(expectedHashes));
  const target = join(assets, 'sdk-workflow.gif');
  await sharp(Buffer.concat(frames), {
    raw: { width: gifWidth, height: gifHeight * frames.length, channels: 4, pageHeight: gifHeight },
  }).gif({ loop: 0, delay: delays, colours: 256, dither: 0, effort: 7 }).toFile(target);
  const metadata = await sharp(target, { animated: true }).metadata();
  if (metadata.pages < 2 || metadata.loop !== 0
    || metadata.delay.reduce((sum, value) => sum + value, 0) !== durationMs) {
    throw new Error('Expected a looping eight-second animation');
  }
  console.log(JSON.stringify({ path: 'docs/assets/sdk-workflow.png', width, height, frames: expectedHashes.length, durationMs, bytes: animatedPng.length, gifFrames: metadata.pages }));
}
