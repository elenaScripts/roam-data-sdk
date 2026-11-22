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
// Original side-profile dog drawing with an articulated diagonal trot
const words = [[80, 'Validate'], [210, 'Measure'], [350, 'Summarize']];
const walkCurve = [[700, 478], [820, 497], [1120, 458], [1255, 478]];
const body = 'M115 142 C144 112 195 108 241 113 C294 117 333 124 368 111 L398 70 C410 54 430 44 451 48 C467 51 480 60 491 72 L526 86 Q535 91 532 102 Q530 110 517 111 L488 112 C479 127 464 136 443 139 L430 153 L432 163 L418 172 C407 187 388 198 365 201 C302 219 231 208 185 199 C163 194 144 183 132 170Z';
const tail = 'M137 144 C108 143 88 126 68 109 C48 93 28 89 16 96 C10 100 9 91 17 85 C34 76 57 82 80 96 C104 113 119 119 145 121Z';
const ear = 'M431 52 C414 52 400 63 401 82 L413 121 Q421 129 432 121 Q437 111 433 90 Q430 72 440 61Z';
const pawColor = { near: c.ink, far: c.side };

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

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
const times = (a, value) => [a[0] * value, a[1] * value];
const normal = vector => {
  const length = Math.hypot(...vector);
  return [-vector[1] / length, vector[0] / length];
};
const pair = point => point.map(value => value.toFixed(3)).join(' ');

function leg(hip, foot, upper, lower, bend, color, rear = false) {
  const delta = subtract(foot, hip);
  const distance = Math.min(upper + lower - .001, Math.hypot(...delta));
  const unit = times(delta, 1 / Math.hypot(...delta));
  const along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance);
  const offset = Math.sqrt(Math.max(0, upper ** 2 - along ** 2));
  const knee = add(add(hip, times(unit, along)), times([-unit[1], unit[0]], offset * bend));
  const first = normal(subtract(knee, hip));
  const second = normal(subtract(foot, knee));
  const middle = add(first, second);
  const kneeNormal = times(middle, 1 / Math.hypot(...middle));
  const hipWidth = rear ? 13 : 11;
  const kneeWidth = rear ? 8 : 7;
  const ankleWidth = 4.5;
  const leftHip = add(hip, times(first, hipWidth));
  const rightHip = add(hip, times(first, -hipWidth));
  const leftKnee = add(knee, times(kneeNormal, kneeWidth));
  const rightKnee = add(knee, times(kneeNormal, -kneeWidth));
  const leftAnkle = add(foot, times(second, ankleWidth));
  const rightAnkle = add(foot, times(second, -ankleWidth));
  const mix = (a, b, amount) => add(times(a, 1 - amount), times(b, amount));
  const leftBefore = mix(leftHip, leftKnee, .72);
  const leftAfter = mix(leftKnee, leftAnkle, .28);
  const rightBefore = mix(rightHip, rightKnee, .72);
  const rightAfter = mix(rightKnee, rightAnkle, .28);
  return `<path d="M${pair(leftHip)} L${pair(leftBefore)} Q${pair(leftKnee)} ${pair(leftAfter)} L${pair(leftAnkle)} Q${foot[0] - 4} ${foot[1] + 7} ${foot[0] + 3} ${foot[1] + 7} L${foot[0] + 13} ${foot[1] + 7} Q${foot[0] + 20} ${foot[1] + 2} ${foot[0] + 8} ${foot[1] - 3} L${pair(rightAnkle)} L${pair(rightAfter)} Q${pair(rightKnee)} ${pair(rightBefore)} L${pair(rightHip)}Z" fill="${color}" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
}

function dog(time, still = false) {
  const phase = still ? .75 : Math.PI * 2 * time / 800;
  const bounce = still ? 0 : 2 * Math.cos(phase * 2);
  const foot = (x, angle, stride, lift) => [
    x + stride * Math.cos(angle),
    285 - bounce - lift * Math.max(0, -Math.sin(angle)) ** 1.5,
  ];
  const nearFront = leg([378, 177], foot(378, phase, 37, 35), 57, 65, 1, pawColor.near);
  const farFront = leg([362, 179], foot(362, phase + Math.PI, 37, 35), 57, 65, 1, pawColor.far);
  const nearHind = leg([170, 180], foot(170, phase + Math.PI, 43, 38), 55, 65, -1, pawColor.near, true);
  const farHind = leg([185, 179], foot(185, phase, 43, 38), 55, 65, -1, pawColor.far, true);
  const tailAngle = still ? -3 : 6 * Math.sin(phase / 2);
  const earAngle = still ? 0 : -4 * Math.sin(phase - .4);
  return `<g transform="translate(660 ${118 + bounce * 1.12}) scale(1.12)">
    ${farHind}${farFront}
    <path d="${tail}" fill="${c.face}" transform="rotate(${tailAngle} 137 135)"/>
    <path d="${body}" fill="${c.ink}"/>
    ${nearHind}${nearFront}
    <path d="${ear}" fill="${c.face}" transform="rotate(${earAngle} 423 65)"/>
    <path d="M406 112 Q422 124 442 128" fill="none" stroke="${c.amber}" stroke-width="6"/>
    <circle cx="435" cy="140" r="8" fill="${c.amber}"/>
    <circle cx="435" cy="140" r="2.4" fill="${c.paper}"/>
    <circle cx="467" cy="74" r="3.5" fill="${c.paper}"/>
    <path d="M524 87 Q538 91 531 101 L522 100Z" fill="${c.paper}"/>
    <path d="M485 106 Q499 115 516 107" fill="none" stroke="${c.paper}" stroke-width="2.7" stroke-linecap="round"/>
  </g>`;
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1400 840"><title>Roam data SDK workflow</title><desc>An illustrated dog trots above a schematic location trail. Roam validates and summarizes supplied location data. The synthetic walk example has two points, an estimated distance of 1.112 km, and a ten-minute segment span.</desc>${content}</svg>`;
}

const backgroundScene = scene();
const posterSvg = svg(backgroundScene + motion(6400, true));
await writeFile(join(assets, 'sdk-overview.svg'), posterSvg.replace(/[ \t]+$/gm, '') + '\n');
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
  // Keep typography fixed while the dog trots and the route marker moves
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
