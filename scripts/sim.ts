// npm run sim -- --wpm 40 --reaction 0.7 --policy abbr-first --seeds 20
import { runBotBatch, type Policy } from '../src/sim/bot';

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const wpm = Number(arg('wpm', '40'));
const reaction = Number(arg('reaction', '0.7'));
const policy = arg('policy', 'abbr-first') as Policy;
const seeds = Number(arg('seeds', '20'));
const verbose = process.argv.includes('--verbose');

const t0 = Date.now();
const summary = runBotBatch(wpm, reaction, policy, Array.from({ length: seeds }, (_, i) => i + 1));
const elapsed = (Date.now() - t0) / 1000;
const { results, ...head } = summary;
console.log(JSON.stringify({ ...head, elapsed_s: elapsed }, null, 2));
if (verbose) {
  for (const r of results) console.log(`${r.seed}\t${r.result}\t${r.survivedS.toFixed(1)}s\tL${r.level}\tkills ${r.kills}\t${r.cards.join(',')}\t${r.lastHit ?? ''}`);
}
