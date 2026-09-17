// T-E2E-01: 타이틀 → 런 → 명령 → (레벨업) → 일시정지 → 결과 까지 실제 입력으로 완주하고 캡처를 남긴다.
// 실행: npm run e2e  (미리 npm run build && npx vite preview --port 4173)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_URL ?? 'http://localhost:4173/';
const OUT = 'captures';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
await page.goto(BASE);
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/01_title.png` });

// 타이틀 → 시작
await page.keyboard.press('Enter');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/02_run_waiting.png` });

// 첫 명령: slash left. (한 글자씩)
const typeCmd = async (s: string, delay = 90) => {
  for (const ch of s) {
    await page.keyboard.press(ch === ' ' ? 'Space' : ch === '.' ? 'Period' : ch);
    await page.waitForTimeout(delay);
  }
};
await typeCmd('slash left.');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/03_after_first_kill.png` });

// F3 개발 모드, 일시정지 F10
await page.keyboard.press('F3');
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/04_devmode.png` });
await page.keyboard.press('F3');
await page.keyboard.press('F10');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/05_pause.png` });
// 설정 열기
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/06_settings.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.keyboard.press('Escape'); // 일시정지 해제
await page.waitForTimeout(300);

// 전투 계속: 몇 명령 더 (적이 왼쪽에서 오므로 slash left. 반복 + 이동)
// 간단한 자동 플레이: 인접 시전 적을 향해 slash, 레벨업이면 1번 확정
type S = { phase: string; player: { cell: [number, number]; buffer: string }; enemies: { cell: [number, number]; state: string; castRemaining: number }[] };
const dirName = (dx: number, dy: number) => (dy < 0 ? (dx < 0 ? 'upleft' : dx > 0 ? 'upright' : 'up') : dy > 0 ? (dx < 0 ? 'downleft' : dx > 0 ? 'downright' : 'down') : dx < 0 ? 'left' : 'right');
let shots = 0;
for (let i = 0; i < 60; i++) {
  const st = (await page.evaluate(() => (window as unknown as { __sim?: { state: () => unknown } }).__sim?.state())) as S | undefined;
  if (!st) break;
  if (st.phase === 'result') break;
  if (st.phase === 'levelup') {
    await page.screenshot({ path: `${OUT}/08_levelup_${shots}.png` });
    await page.keyboard.press('1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    continue;
  }
  if (st.phase === 'combat' && st.player.buffer === '') {
    const p = st.player.cell;
    const adj = st.enemies.filter((e) => Math.max(Math.abs(e.cell[0] - p[0]), Math.abs(e.cell[1] - p[1])) === 1).sort((a, b) => a.castRemaining - b.castRemaining);
    if (adj[0]) {
      const d = dirName(adj[0].cell[0] - p[0], adj[0].cell[1] - p[1]);
      await typeCmd(`slash ${d}.`, 60);
    }
  }
  if (i % 8 === 3 && shots < 4) await page.screenshot({ path: `${OUT}/07_combat_${shots++}.png` });
  await page.waitForTimeout(500);
}

// 죽을 때까지 대기 (최대 120초) — 아무 입력 없이
let result = null as null | string;
for (let i = 0; i < 120; i++) {
  await page.waitForTimeout(1000);
  const ph = await page.evaluate(() => (window as unknown as { __sim?: { state: () => { phase: string } } }).__sim?.state().phase);
  if (ph === 'levelup') {
    await page.keyboard.press('Enter');
  }
  if (ph === 'result' || ph === undefined) {
    result = ph ?? 'scene changed';
    break;
  }
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/09_result.png` });
// 결과 → 타이틀 → 기록
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/10_records.png` });

console.log('result phase:', result);
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.length ? 1 : 0);
