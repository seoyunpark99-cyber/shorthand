// npm run replay -- <file.json>
import { readFileSync } from 'node:fs';
import { replay, type ReplayFile } from '../src/sim/replay';

const path = process.argv[2];
if (!path) {
  console.error('usage: npm run replay -- <replay.json>');
  process.exit(2);
}
const file = JSON.parse(readFileSync(path, 'utf-8')) as ReplayFile;
const r = replay(file);
console.log(JSON.stringify({ file: path, seed: file.seed, ...r }, null, 2));
process.exit(r.match === false ? 1 : 0);
