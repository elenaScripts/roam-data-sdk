import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { ApngEncoder } from './apng.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
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
  paper: '#f5f2ea', chalk: '#fffef8', ink: '#183a2e', muted: '#435b4d',
  birch: '#d9ba88', amber: '#bf8135', glass: '#277b73', moss: '#6c8064',
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
const inputCurve = [[365, 443], [410, 443], [420, 395], [502, 395]];
const outputCurve = [[856, 486], [906, 517], [931, 433], [994, 433]];
const curvePath = points => `M ${points[0].join(' ')} C ${points.slice(1).map(p => p.join(' ')).join(', ')}`;
const body = 'M520 320 C550 292 592 304 620 316 C662 335 688 294 740 308 C792 321 824 325 848 369 C870 408 829 439 843 475 C860 518 835 567 791 574 C738 584 707 549 664 565 C612 586 558 588 526 553 C497 522 508 488 483 460 C460 436 471 406 488 382 C506 358 493 341 520 320 Z';
const glassBlob = 'M-18 -15 C-9 -25 1 -20 8 -24 C20 -28 26 -13 20 -3 C14 8 22 18 11 24 C1 31 -8 17 -17 20 C-30 24 -31 10 -23 1 C-17 -5 -25 -8 -18 -15 Z';

function scene() {
  const slats = Array.from({ length: 7 }, (_, index) => {
    const offset = index * 19;
    return `<path d="M${1090 + offset} -45 V46 Q${1090 + offset} 118 ${1162 + offset} 118 H1490" fill="none" stroke="#ddd8cc" stroke-width="24" transform="translate(3 7)" opacity=".35"/>
<path d="M${1090 + offset} -45 V46 Q${1090 + offset} 118 ${1162 + offset} 118 H1490" fill="none" stroke="#fffef9" stroke-width="18"/>`;
  }).join('\n');
  const woodLayers = Array.from({ length: 5 }, (_, index) =>
    `<path d="${body}" fill="none" stroke="${index % 2 ? '#e9d5af' : '#bfa071'}" stroke-width="1.35" transform="translate(${670 * index * .012} ${442 * index * .012}) scale(${1 - index * .012})" opacity=".65"/>`).join('\n');
  return `
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9f7f0"/><stop offset="1" stop-color="#eeede2"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0dfba"/><stop offset=".45" stop-color="#d9bb8b"/><stop offset="1" stop-color="#bb955f"/></linearGradient>
  <linearGradient id="plaster" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fffefb"/><stop offset="1" stop-color="#edeadd"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bce5c6" stop-opacity=".9"/><stop offset=".55" stop-color="#469b86" stop-opacity=".65"/><stop offset="1" stop-color="#17645e" stop-opacity=".85"/></linearGradient>
  <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5d58b"/><stop offset=".6" stop-color="#c58b35"/><stop offset="1" stop-color="#a76826"/></linearGradient>
  <linearGradient id="sunlight" x1="0" y1="0" x2="1" y2="0"><stop stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
  <filter id="shadow" x="-35%" y="-35%" width="180%" height="190%"><feDropShadow dx="4" dy="12" stdDeviation="4" flood-color="#405046" flood-opacity=".13"/></filter>
  <filter id="smallShadow" x="-35%" y="-35%" width="170%" height="180%"><feDropShadow dx="2" dy="5" stdDeviation="1.7" flood-color="#4c4936" flood-opacity=".12"/></filter>
  <pattern id="woodgrain" width="23" height="125" patternUnits="userSpaceOnUse"><path d="M5 -5 Q12 42 6 83 T8 135 M17 -5 Q10 30 16 68 T17 130" fill="none" stroke="#8d6e40" stroke-width=".7" opacity=".11"/></pattern>
</defs>
<rect width="1400" height="840" fill="url(#paper)"/>
<path d="M0 765 C218 710 240 828 454 797 S790 752 946 803 S1230 785 1400 721 V840 H0Z" fill="#e7e7d9" opacity=".5"/>
${slats}
<path d="M1120 0 L1400 0 L1400 210Z" fill="#e7dec9" opacity=".19"/>
<g font-family="Avenir Next, Futura, DejaVu Sans, sans-serif" font-weight="500" fill="${c.ink}">
  <text x="80" y="63" font-size="18" letter-spacing="1.1" fill="${c.muted}">TypeScript / Node.js</text>
  <text x="76" y="130" font-size="62" font-weight="600" letter-spacing="-2.6">Roam data SDK</text>
  <text x="80" y="174" font-size="26" fill="${c.muted}">Offline tools for pet location data</text>
  <g font-size="21" font-weight="600">
    <text x="80" y="266"><tspan fill="${c.amber}">01</tspan><tspan dx="13">Your data</tspan></text>
    <text x="501" y="266"><tspan fill="${c.amber}">02</tspan><tspan dx="13">Local processing</tspan></text>
    <text x="1010" y="266"><tspan fill="${c.amber}">03</tspan><tspan dx="13">Useful results</tspan></text>
  </g>
</g>
<g filter="url(#smallShadow)">
  <rect x="91" y="339" width="272" height="227" rx="16" fill="url(#wood)"/>
  <rect x="83" y="328" width="272" height="227" rx="16" fill="url(#plaster)" stroke="#e3dfd2"/>
  <path d="M83 348 Q83 328 102 328 H120 V555 H102 Q83 555 83 536Z" fill="url(#wood)"/>
  <path d="M83 348 Q83 328 102 328 H120 V555 H102 Q83 555 83 536Z" fill="url(#woodgrain)"/>
</g>
<g font-family="Avenir Next, DejaVu Sans, sans-serif" font-weight="500">
  <text x="142" y="373" font-size="18" fill="${c.muted}">JSON history</text>
  <text x="142" y="418" font-size="25" fill="${c.ink}">Coordinates</text>
  <text x="142" y="460" font-size="25" fill="${c.ink}">Timestamps</text>
  <text x="142" y="502" font-size="25" fill="${c.ink}">Segments</text>
  <text x="84" y="604" font-size="19" fill="${c.muted}">Supplied by your app</text>
</g>
<g fill="none" stroke-linecap="round">
  <path d="${curvePath(inputCurve)}" stroke="#dfd0b4" stroke-width="11"/>
  <path d="${curvePath(inputCurve)}" stroke="#fbf3df" stroke-width="4" transform="translate(0 -2)"/>
  <path d="${curvePath(outputCurve)}" stroke="#dfd0b4" stroke-width="11"/>
  <path d="${curvePath(outputCurve)}" stroke="#fbf3df" stroke-width="4" transform="translate(0 -2)"/>
</g>
<g filter="url(#shadow)">
  <path d="${body}" fill="url(#wood)" transform="translate(0 11)"/>
  <path d="${body}" fill="url(#wood)"/>
  ${woodLayers}
  <path d="${body}" fill="url(#plaster)" transform="translate(670 442) scale(.91) translate(-670 -442)"/>
</g>
<g font-family="Avenir Next, DejaVu Sans, sans-serif" font-weight="500" fill="${c.ink}" font-size="25">
  <g fill="none" stroke="#c2cbbd" stroke-width="1.4"><circle cx="551" cy="385" r="12"/><circle cx="551" cy="440" r="12"/><circle cx="551" cy="495" r="12"/></g>
  <path d="M551 399 V426 M551 454 V481" stroke="#d0d6c8" fill="none"/>
  <text x="580" y="393">Validate</text>
  <text x="580" y="448">Measure</text>
  <text x="580" y="503">Summarize</text>
</g>
<text x="670" y="638" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="22" fill="${c.ink}">summarizeDataset(data)</text>
<g font-family="Avenir Next, DejaVu Sans, sans-serif" font-weight="500" font-size="19" fill="${c.muted}">
  <text x="1010" y="414">Estimated distance</text>
  <text x="1010" y="518">Recorded duration</text>
  <text x="1010" y="605">Supplied points</text>
</g>
<path d="M1010 643 C1080 670 1135 622 1220 643" stroke="#cbb58d" stroke-width="3" fill="none"/>
<circle cx="1010" cy="643" r="6" fill="${c.glass}"/>
<circle cx="1220" cy="643" r="6" fill="${c.amber}"/>
<path d="M80 722 H1320" stroke="#d9ddd0"/>
<g font-family="Avenir Next, DejaVu Sans, sans-serif" font-weight="500" font-size="19" fill="${c.muted}">
  <text x="80" y="772">Synthetic example</text>
  <text x="1320" y="772" text-anchor="end">Local data / No network requests</text>
</g>`;
}

function bead(time, start, duration, curve, amber = false) {
  const p = progress(time, start, start + duration);
  if (p <= 0 || p >= 1) return '';
  const position = pointOnCurve(easeInOut(p), curve);
  const opacity = Math.min(progress(p, 0, .12), 1 - progress(p, .88, 1));
  const tilt = -14 + 28 * p;
  return `<g transform="translate(${position[0]} ${position[1]}) rotate(${tilt}) scale(.56)" opacity="${opacity}"><path d="${glassBlob}" fill="url(#${amber ? 'amber' : 'glass'})" stroke="#fffef8" stroke-opacity=".72" stroke-width="2"/><path d="M-14 -10 Q-9 -18 -1 -15" fill="none" stroke="white" stroke-opacity=".85" stroke-width="2.3" stroke-linecap="round"/></g>`;
}

function motion(time, still = false) {
  const phase = Math.PI * 2 * time / durationMs;
  const loopReset = 1 - easeOut(progress(time, 7800, 8000));
  const values = [
    [1010, 388, summary.distanceKm.toFixed(3) + ' km', 49],
    [1010, 492, summary.durationMs / 60_000 + ' min', 47],
    [1010, 580, summary.pointCount + ' points', 34],
  ].map(([x, y, text, size], index) => {
    const opacity = still ? 1 : easeOut(progress(time, 5100 + 80 * index, 5300 + 80 * index)) * loopReset;
    return `<text x="${x}" y="${y}" font-family="Avenir Next, DejaVu Sans, sans-serif" font-size="${size}" font-weight="600" letter-spacing="-1.5" fill="${c.ink}" opacity="${opacity}">${text}</text><text x="${x}" y="${y}" font-family="DejaVu Sans, sans-serif" font-size="${size}" fill="#aeb8a6" opacity="${1 - opacity}">—</text>`;
  }).join('\n');
  const lights = `<g opacity=".24" transform="translate(${still ? 0 : 12 * Math.sin(phase)} ${still ? 0 : 4 * Math.sin(phase)})"><path d="${glassBlob}" transform="translate(1265 204) rotate(${still ? 10 : 10 + 4 * Math.sin(phase)}) scale(1.35)" fill="url(#glass)" stroke="#eff9ef" stroke-width="1.4"/><path d="${glassBlob}" transform="translate(1284 214) rotate(10) scale(1.32)" fill="none" stroke="#9cbaa2" stroke-width="1"/></g>`;
  const selected = [385, 440, 495].map((y, index) => {
    const start = 2100 + 680 * index;
    const completed = easeOut(progress(time, start + 200, start + 400)) * .62 * loopReset;
    const opacity = still ? .7 : Math.max(completed, pulse(time, start, start + 1100) * .85);
    return `<g opacity="${opacity}"><circle cx="551" cy="${y}" r="13" fill="url(#glass)"/><path d="M546 ${y} l4 4 l7 -8" fill="none" stroke="#fffef8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }).join('\n');
  const sourceGlow = [405, 447, 489].map((y, index) => `<rect x="128" y="${y - 24}" width="4" height="28" rx="2" fill="${c.glass}" opacity="${still ? 0 : .8 * pulse(time, 100 + 400 * index, 900 + 400 * index)}"/>`).join('\n');
  const daylight = `<path d="M1060 -40 H1190 L1410 225 H1270Z" fill="url(#sunlight)" opacity=".5" transform="translate(${still ? 0 : 20 * Math.sin(phase)} 0)"/>`;
  return daylight + lights + sourceGlow + selected + values
    + (still ? '' : bead(time, 600, 1750, inputCurve) + bead(time, 1100, 1750, inputCurve, true)
      + bead(time, 3900, 1300, outputCurve) + bead(time, 4280, 1300, outputCurve, true));
}
function svg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1400 840"><title>Roam data SDK workflow</title><desc>Supplied JSON is validated and summarized locally. The synthetic example has two points, an estimated distance of 1.112 km, and a ten-minute segment span.</desc>${content}</svg>`;
}

const backgroundScene = scene();
const posterSvg = svg(backgroundScene + motion(6400, true));
await writeFile(join(assets, 'sdk-overview.svg'), posterSvg + '\n');
await sharp(Buffer.from(posterSvg)).png().toFile(join(assets, 'sdk-overview.png'));
const background = await sharp(Buffer.from(svg(backgroundScene))).png().toBuffer();
const snapshots = new Map([[1000, 'input'], [3400, 'processing'], [6400, 'result']]);
const frames = [];
const delays = [];
const expectedHashes = [];
const apng = previewOnly ? null : new ApngEncoder(width, height, durationMs / frameMs, frameMs);
let previousRaw;
for (let time = 0; time < durationMs; time += frameMs) {
  if (previewOnly && !snapshots.has(time)) continue;
  // Reuse the material-rich still scene and animate only attention and flow
  const overlay = svg('<defs>' + backgroundScene.split('<defs>')[1].split('</defs>')[0] + '</defs>' + motion(time));
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
