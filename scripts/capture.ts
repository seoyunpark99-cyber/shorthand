// npm run capture : 대표 장면 fixture(플레이어 (5,5), 잔병 (4,5) 시전 1.8초, 속사병·추적자, 조각, 축약 A01, 막기) 캡처
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_URL ?? 'http://localhost:4173/';
mkdirSync('captures', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(BASE);
await page.waitForTimeout(2500);
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
await page.keyboard.press('x');
await page.keyboard.press('Escape');

// 문자열로 넘겨 esbuild 헬퍼(__name) 주입을 피한다
const FIXTURE = `
(() => {
  const st = window.__sim.state();
  const g = st.enemies[0];
  g.castRemaining = 1.8; g.castTotal = 6;
  const base = { hp: 2, hpMax: 2, state: 'cast', moveTimer: 0.8, castTotal: 6, castStartedStep: -1, recoveryTimer: 0, recoverySetStep: -1, warned: false, locked: false };
  st.enemies.push(Object.assign({}, base, { id: 2, type: 'rapid', cell: [6, 4], castDir: 'upright', castRemaining: 0.9, telegraphCells: [[5, 5]] }));
  st.enemies.push(Object.assign({}, base, { id: 3, type: 'chaser', cell: [5, 7], castDir: 'down', castRemaining: 4.2, telegraphCells: [[5, 5]] }));
  st.enemies.push(Object.assign({}, base, { id: 4, type: 'grunt', cell: [8, 8], castDir: null, castRemaining: 0, telegraphCells: [], state: 'approach' }));
  st.nextEnemyId = 5;
  st.shards.push({ cell: [7, 6], xp: 2 });
  st.shards.push({ cell: [3, 3], xp: 1 });
  st.spawnTelegraphs.push({ cell: [2, 8], type: 'grunt', remaining: 0.6 });
  st.player.cards.push({ id: 'A01', rank: 1 });
  st.player.guard = { dir: 'left', remaining: 2.0 };
  st.player.hp = 3;
  return true;
})()`;
await page.evaluate(FIXTURE);
await page.keyboard.press('s');
await page.waitForTimeout(120);
await page.keyboard.press('l');
await page.waitForTimeout(120);
await page.keyboard.press('Space');
await page.waitForTimeout(250);
await page.screenshot({ path: 'captures/fixture_pilot_hud.png' });
await page.keyboard.press('F3');
await page.waitForTimeout(150);
await page.screenshot({ path: 'captures/fixture_pilot_hud_dev.png' });
await browser.close();
console.log('captures/fixture_pilot_hud.png');
