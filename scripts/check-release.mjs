import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const excluded = new Set(['.git', 'node_modules', 'dist', 'output', 'coverage']);
// Pin the exact artwork after visual review; other binaries still fail
const reviewedImages = new Map([
  ['docs/assets/dog-run-sheet.png', {
    sha256: '5f48c1314480b123c2eafb799daedcefbfb6ddf78b8b57c7b8feb59c99ebd9d6',
    signature: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  }],
  ['docs/assets/sdk-overview.png', {
    sha256: '8a214ddac4919c9a3e4a6bd55142b84fa45ca5236c45aa2ca5430d3dcab1f4f6',
    signature: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  }],
  ['docs/assets/sdk-workflow.gif', {
    sha256: 'bb9faa8f5b1b6015806e9a7a9464e58f4f18f784913bc043796f44c11bc0b9c1',
    signature: Buffer.from('GIF89a'),
  }],
  ['docs/assets/sdk-workflow.png', {
    sha256: '7a9b07b358629ca75c9519ada07ff1cc2df08eda81bb9bf73e14d57f484d9173',
    signature: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  }],
]);
async function walk(relative = '') {
  const paths = [];
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}

let paths;
try {
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (resolve(gitRoot) !== resolve(root)) throw new Error('Not the repository root');
  paths = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  if (!paths.length) throw new Error('No tracked files');
} catch { paths = await walk(); }

const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['provider token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|AIza[A-Za-z0-9_-]{35}|(?:AKIA|ASIA)[A-Z0-9]{16})\b/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['URL with embedded sign-in values', /https?:\/\/[^\s/@:]+:[^\s/@]+@[^\s'"`)<]+/],
  ['personal filesystem path', /\/(?:Users|home)\/[A-Za-z0-9._-]+\//],
];
const failures = [];
for (const path of paths) {
  const parts = path.split('/');
  const name = parts.at(-1);
  if (parts.some(part => excluded.has(part)) || /^\.env(?:\.|$)/.test(name)
    || /\.(?:pem|key|p12|pfx|tgz|zip|log|geojson)$/i.test(name)) {
    failures.push(`${path}: excluded release file`);
    continue;
  }
  if ((await lstat(join(root, path))).isSymbolicLink()) {
    failures.push(`${path}: symbolic link requires review`);
    continue;
  }
  const bytes = await readFile(join(root, path));
  if (reviewedImages.has(path)) {
    const reviewed = reviewedImages.get(path);
    if (!bytes.subarray(0, reviewed.signature.length).equals(reviewed.signature)
      || createHash('sha256').update(bytes).digest('hex') !== reviewed.sha256) {
      failures.push(`${path}: reviewed image checksum mismatch`);
    }
    continue;
  }
  if (bytes.includes(0)) { failures.push(`${path}: binary file requires review`); continue; }
  const contents = bytes.toString('utf8');
  for (const [label, pattern] of patterns) {
    if (pattern.test(contents)) failures.push(`${path}: possible ${label}`);
  }
  if (path.startsWith('src/') && (/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(contents)
    || /https?:\/\//.test(contents)
    || /\bfrom\s*['"](?!\.)/.test(contents)
    || /\bimport\s*\(/.test(contents))) {
    failures.push(`${path}: review external imports or network APIs in the offline core`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Release scan passed for ${paths.length} files; offline core has no external imports or network APIs`);
  console.log('Pattern checks do not guarantee detection of every sensitive value');
}
