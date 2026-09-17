# SHORTHAND MVP (5분 압축판)

타이핑 액션 로그라이트 검증판. 기획 기준본: `docs/planning/` (spec 1.0 / contract 1.0, 2026-09-17).
검증 질문 하나: **"적이 빨라지는 속도와 내 명령이 짧아지는 속도가 맞붙을 때, 살아남는 것이 재미있는가."**

## 실행

| 목적 | 명령 | 결과 |
|---|---|---|
| setup | `npm ci` | 의존성 설치 (Node 22+) |
| dev | `npm run dev` | Vite 개발 서버 (http://localhost:5173) |
| test | `npm test` | Vitest — 시나리오 S-01~S-16, 파서, 난도 표 |
| sim-bot | `npm run sim -- --wpm 40 --reaction 0.7 --policy abbr-first --seeds 20 [--verbose]` | 가상 플레이어 통계 JSON |
| replay | `npm run replay -- <replay.json>` | 기록 재생·해시 대조 |
| build | `npm run build` | `dist/` (정적 웹) |
| preview | `npx vite preview --port 4173` | 빌드 결과 미리보기 |
| e2e | `npm run e2e` | Playwright(설치된 Chrome)로 타이틀→런→레벨업→결과→기록 완주, `captures/` |
| capture | `npm run capture` | 대표 전투 장면 fixture 캡처 |

브라우저에서 `F3` 개발 모드(asset_id·placeholder·M(t)·스텝), 콘솔 `window.__sim.state()` / `.hash()` / `.replay()`.

## 조작
- 영문 입력. `slash left.` `thrust up.` `guard right.` `m 6`(가로 축약 보유 시) 등. 완성되는 순간 실행.
- Backspace 한 글자, Esc 버퍼 비움(빈 버퍼에서 Esc 또는 F10 = 일시정지).
- 레벨업: 1/2/3 선택, Enter 확정. 결과: 1 같은 시드 / 2 새 시드.

## 구조
```
data/               수치 단일 원본 (commands·cards·enemies·gauge_and_spawn)
shared/             asset_contract·ui_tokens·strings (런타임 로드)
src/sim/            순수 시뮬레이션 (DOM 무의존): core, parser, growth, bot, replay, rng, data
src/game/           Phaser 4 렌더·HUD·화면·입력·오디오·저장·assets.resolver
scripts/            sim / replay / e2e / capture
tests/              Vitest
public/assets/manifest.json   디자인 납품 manifest 자리 (비어 있으면 placeholder)
docs/planning/      기획 기준본 사본
```

## 에셋 교체
`public/assets/manifest.json`에 `{ asset_id, clip_id, frame_id | state, relative_path }` 항목을 추가하면 리졸버가 로드·검사(project_id·contract_version·캔버스 크기)하고, 실패 항목은 placeholder 를 유지한 채 F3 화면에 보고한다. 코드는 `binding_key`/`asset_id` 만 참조한다.

## 상태
- 구현: 전체 MVP(8화면, 시뮬, 봇, 재현성, placeholder 에셋, 비프 오디오, localStorage 저장). Electron 패키징(job.dev.10)은 웹 배포 우선으로 제외.
- 변경·이슈: `docs/DEV_NOTES.md` (CR-01 보스 난도 하한, CR-02 밸런스 튜닝, 미확인 항목).
