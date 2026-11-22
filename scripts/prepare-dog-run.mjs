import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = process.env.ROAM_ASSET_MODULE_ROOT
  ? createRequire(join(resolve(process.env.ROAM_ASSET_MODULE_ROOT), 'package.json'))
  : createRequire(import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const image = sharp(join(root, 'docs/assets/dog-run-sheet.png'));
const metadata = await image.metadata();

function simplify(points, epsilon = 1.6) {
  if (points.length < 3) return points;
  const first = points[0], last = points.at(-1);
  const dx = last[0] - first[0], dy = last[1] - first[1];
  const length = dx * dx + dy * dy;
  let farthest = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const t = length ? Math.max(0, Math.min(1, ((p[0] - first[0]) * dx + (p[1] - first[1]) * dy) / length)) : 0;
    const distance = Math.hypot(p[0] - first[0] - t * dx, p[1] - first[1] - t * dy);
    if (distance > farthest) { farthest = distance; index = i; }
  }
  if (farthest <= epsilon) return [first, last];
  return [...simplify(points.slice(0, index + 1), epsilon).slice(0, -1), ...simplify(points.slice(index), epsilon)];
}
function contours(mask, width, height) {
  const stride = width + 1, edges = new Map();
  const inside = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  const edge = (x1, y1, x2, y2) => {
    const start = y1 * stride + x1, end = y2 * stride + x2;
    const list = edges.get(start) ?? []; list.push(end); edges.set(start, list);
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (inside(x, y)) {
    if (!inside(x, y - 1)) edge(x, y, x + 1, y);
    if (!inside(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
    if (!inside(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
    if (!inside(x - 1, y)) edge(x, y + 1, x, y);
  }
  const loops = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    let current = start, previous = null;
    const points = [];
    do {
      points.push([current % stride, Math.floor(current / stride)]);
      const options = edges.get(current);
      if (!options?.length) throw new Error('Open silhouette contour');
      let choice = 0;
      if (previous !== null && options.length > 1) {
        const incoming = [current % stride - previous % stride, Math.floor(current / stride) - Math.floor(previous / stride)];
        let best = -Infinity;
        options.forEach((end, index) => {
          const outgoing = [end % stride - current % stride, Math.floor(end / stride) - Math.floor(current / stride)];
          const cross = incoming[0] * outgoing[1] - incoming[1] * outgoing[0];
          const dot = incoming[0] * outgoing[0] + incoming[1] * outgoing[1];
          const score = cross > 0 ? 3 : dot > 0 ? 2 : cross < 0 ? 1 : 0;
          if (score > best) { best = score; choice = index; }
        });
      }
      const next = options.splice(choice, 1)[0];
      if (!options.length) edges.delete(current);
      previous = current; current = next;
      if (points.length > width * height * 4) throw new Error('Silhouette contour did not close');
    } while (current !== start);
    const area = points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
    if (Math.abs(area) >= 10) loops.push(simplify([...points, points[0]]).slice(0, -1));
  }
  return loops;
}
const number = value => Number(value.toFixed(2));
const poses = [];
for (let index = 0; index < 10; index++) {
  const column = index % 5, row = Math.floor(index / 5);
  const left = Math.round(column * metadata.width / 5), top = Math.round(row * metadata.height / 2);
  const width = Math.round((column + 1) * metadata.width / 5) - left;
  const height = Math.round((row + 1) * metadata.height / 2) - top;
  const pixels = await sharp(join(root, 'docs/assets/dog-run-sheet.png')).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer();
  const mask = new Uint8Array(width * height);
  let count = 0, headRight = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    if (pixels[offset + 3] > 180 && pixels[offset] < 120 && pixels[offset + 1] < 120 && pixels[offset + 2] < 120) {
      mask[y * width + x] = 1; count++;
      if (y < height * .55) headRight = Math.max(headRight, x);
    }
  }
  if (count < width * height * .04) throw new Error('Empty dog pose ' + index);
  const shiftX = 376 - headRight * 400 / width;
  // Register the torso rather than the changing nose, paws or tail extremities
  let mass = 0, bodyX = 0, bodyY = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (mask[y * width + x]) {
    const px = x * 400 / width + shiftX, py = y * 400 / height;
    if (px >= 130 && px < 300 && py >= 145 && py < 245) {
      mass++; bodyX += px; bodyY += py;
    }
  }
  if (!mass) throw new Error('Missing torso anchor in pose ' + index);
  const registration = { x: 220 - bodyX / mass, y: 200 - bodyY / mass };
  const loops = contours(mask, width, height);
  const path = loops.map(loop => {
    const p = loop.map(([x, y]) => [number(x * 400 / width + shiftX + registration.x), number(y * 400 / height + registration.y)]);
    const mid = (a, b) => [number((a[0] + b[0]) / 2), number((a[1] + b[1]) / 2)];
    const pair = a => a.join(' ');
    let d = 'M' + pair(mid(p.at(-1), p[0]));
    p.forEach((point, i) => { d += ' Q' + pair(point) + ' ' + pair(mid(point, p[(i + 1) % p.length])); });
    return d + 'Z';
  }).join(' ');
  poses.push({ path, foregroundPixels: count, registration });
}
await writeFile(join(root, 'docs/assets/dog-run-frames.json'), JSON.stringify({ cellSize: 400, poses }, null, 2) + '\n');
console.log(JSON.stringify({ poses: poses.length, pathCharacters: poses.reduce((sum, p) => sum + p.path.length, 0) }));
