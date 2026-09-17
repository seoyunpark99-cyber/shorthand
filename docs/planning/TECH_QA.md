# TECH_QA — SHORTHAND MVP

- project_id: shorthand · spec_version 1.0 · contract_version 1.0 · 개발 스택 결정 DC-03 (조사일 2026-09-17, 재확인 기간 3개월)

## 1. 기술 선택과 모듈

| 항목 | 선택 | 필요한 기능 | 근거·조회일 | 미확인과 확인 방법 |
|---|---|---|---|---|
| 언어·런타임 | TypeScript 5.x, Node 22 LTS | 순수 로직 모듈, 테스트 | DC-03 | Node 정확 버전은 개발 세션이 잠금 파일에 기록 |
| 렌더링 | Phaser 4.2.x (WebGL, Canvas 폴백) | 2D 스프라이트, 아틀라스, 텍스트, 트윈 | [Phaser releases](https://github.com/phaserjs/phaser/releases) 2026-09-17 | Phaser 4의 텍스트 렌더링 품질(한글)과 오디오 API를 첫 작업에서 확인 |
| 번들러·개발 서버 | Vite 6 | 빠른 반복, ESM | 일반 | — |
| 테스트 | Vitest | 시뮬레이션 단위·시나리오·봇 시뮬 | 일반 | — |
| 데스크톱 패키징 | Electron 33 이상 (electron-builder) | Windows x64 exe, 창·전체화면, 로컬 파일 저장 | [Phaser+Electron 템플릿](https://phaser.io/news/2026/06/typescript-online-game-template-phaser-colyseus-react-and-electron-in-one-monorepo) | 대체 후보 Tauri 2(작은 용량). 첫 작업에서 IME·키 이벤트 동작이 같은지 확인 후 결정. 기본은 Electron |
| 저장 | JSON 파일 (Electron userData) | 설정·기록 | — | 브라우저 실행 시 localStorage 폴백(개발용) |
| 입력 | DOM keydown + compositionstart/end | 원시 키, IME 감지 | 웹 표준 | Windows 한글 IME에서 compositionstart가 항상 발생하는지 T-INPUT-01로 확인 |

**모듈 구조**

| module_id | 책임 | 입력·출력 | 의존 | 오류·복구 | 데이터 소유 | 테스트 |
|---|---|---|---|---|---|---|
| sim.core | 50ms 스텝 시뮬레이션. GAME_SPEC 2절 전체. 렌더·오디오 의존 없음 | 입력 이벤트 큐 → 상태·이벤트 목록 | data.loader, rng | 잘못된 입력은 무시 후 로그 | 런 상태 | T-SIM-*, T-PARSE-*, 시나리오 전부 |
| parser | 버퍼→명령 파싱, 보유 축약 반영, 후보·남은 글자 계산 | 버퍼, 보유 카드 → 완성 명령 또는 접두어 상태 | data.commands | — | 없음 | T-PARSE-* |
| growth | XP·레벨·카드 후보·적용 | 이벤트 → 카드 3장, 적용 결과 | data.cards, rng(card) | 후보 0이면 응급 | 카드 상태 | T-OFFER-01, T-LEVEL-* |
| spawn | 밴드·간격·상한·위치 | 시각, 보드 → 스폰 명령 | data.spawn, rng(spawn) | 칸 없음 → 재시도 | 스폰 타이머 | T-SPAWN-* |
| ai.enemy / ai.boss | 접근·시전·공격·회복, 보스 패턴 | 적 상태 → 행동 | sim.core | — | 적 상태 | T-ENEMY-01, T-BOSS-* |
| input.layer | DOM 이벤트→입력 이벤트(스텝 정렬), IME·포커스·키 반복 차단, 카드 번호 격리 | OS 이벤트 → 큐 | — | IME 감지 시 정지 | 버퍼 | T-INPUT-* |
| render.board / render.hud | Phaser 씬. 상태 스냅샷을 그린다. VFX 코드 모션 | 상태·이벤트 → 화면 | assets.resolver, ui_tokens | 에셋 누락 시 placeholder | 없음 | T-UI-* (캡처) |
| audio | 큐 재생, 동시 수·볼륨·토글 | 이벤트 → 재생 | assets.resolver | 파일 누락 시 무음+로그 | 없음 | T-AUDIO-01 |
| assets.resolver | binding_key/asset_id → 파일. manifest 로드·검사·교체 | manifest.json | — | 검사 실패 항목은 placeholder 유지 | manifest | T-ASSET-* |
| screens | 타이틀·일시정지·설정·결과·기록 | 상태 → 화면, 입력 → 전이 | save, strings | 저장 실패 안내 | 설정 | T-UI-03~07 |
| save | 설정·기록 JSON, 원자적 쓰기 | — | Electron fs | 손상 시 기본값·백업 | profile | T-SAVE-01 |
| replay | 입력·시각 기록과 재생, 시드 | 기록 파일 | sim.core | — | — | T-SIM-01 |
| sim.bot | 가상 플레이어(WPM·반응·정책) 헤드리스 실행 | 파라미터 → 결과 통계 | sim.core | — | — | T-SIM-BOT |

인터페이스: `sim.step(inputs: InputEvent[]): SimEvent[]` (순수 함수 스타일, 상태는 sim 인스턴스 소유). `parser.parse(buffer, owned): ParseResult{complete?, action, dir, validPrefix, candidates, remainingChars}`. `growth.offer(state, rng): CardOffer`. `assets.resolve(bindingKey): RuntimeAsset`. 버전 필드 spec_version/contract_version을 manifest와 데이터 파일 머리에서 대조하고 다르면 시작 시 경고.

## 2. 데이터·저장·복구

| schema_id | 원본 | 필드 | 로딩·검증 | 버전 |
|---|---|---|---|---|
| data.commands | data/commands.json | GAME_SPEC 2.3 | 시작 시 JSON 스키마 검증(토큰 접두어 충돌 검사 포함: 긴 방향 토큰끼리 마침표 전 접두어 관계면 오류) | spec_version |
| data.cards | data/cards.json | — | 선행 조건 ID 존재, rank_values 길이 = max_rank | 동상 |
| data.enemies | data/enemies.json | — | cast_s_base > 0, hp ≥ 1 | 동상 |
| data.spawn | data/gauge_and_spawn.json | — | 밴드 시간 연속·중첩 없음, pool 확률 합 1.0±0.001 | 동상 |
| profile | userData/profile.json | settings, records[≤50], data_version | 손상 시 profile.bak 시도 → 기본값 | data_version 1 |
| replay | userData/replays/{run_id}.json | seed, spec_version, inputs[{t_step, key}] | 재생 시 spec_version 불일치면 경고 | — |

저장 시점: 설정 변경 즉시, 런 종료 시 기록 추가. 원자적 쓰기(임시 파일 → rename). 런 중 저장 없음(D-03). 재현에 필요한 것: seed, spec_version, 입력 스텝 기록.

## 3. 온라인
N/A. 오프라인 싱글.

## 4. 기본 에셋·최종 교체

- 기본 에셋: asset_contract.placeholder_policy. 개발 세션이 스크립트로 생성(도형 PNG, 비프 OGG). 캔버스·피벗·프레임 수는 계약과 동일.
- manifest: `assets/manifest.json`(기본) / `delivery/manifest.json`(디자인 납품, DELIVERY_MANIFEST 양식). 리졸버는 binding_key → asset_id → artifact 경로.
- 임포트 검사(T-ASSET-01): project_id·contract_version 일치, asset_id 존재, 파일 존재·sha256·크기(112/160/64/240×320)·알파, 프레임 수·순서, 9-slice inset, 오디오 길이·샘플레이트. 실패 항목은 placeholder 유지하고 보고.
- 교체 단위: asset / batch / cue / font. 부분 납품 허용. 이전 manifest 보존과 복귀.
- UI 리졸버: ui_tokens.json을 런타임에 읽어 색·타이포·레이아웃 적용(하드코딩 금지). strings.json도 런타임 로드.
- 개발 모드(F3): 각 스프라이트 위 asset_id, placeholder 여부, 현재 M(t), 스텝 카운터 표시.

## 5. 성능·리소스

| 지표 | 환경 | 장면 | 목표 | 측정 | 실패 |
|---|---|---|---|---|---|
| 렌더 프레임 | Windows 10, 내장 GPU 노트북 | 동시 적 4, 효과 12 | 60fps, 최악 30fps 이상 | Electron 성능 패널 | 30 미만이면 효과 상한 축소 |
| 입력→시뮬 반영 지연 | 동상 | 연타 | ≤50ms(1스텝) + OS 지연 | 로그 타임스탬프 | 100ms 초과 |
| 메모리 | 동상 | 5분 런 | 300MB 이하 | 작업 관리자 | — |
| 설치 용량 | — | — | 150MB 이하 | 패키지 크기 | — |
| 시뮬 봇 속도 | 개발 PC 헤드리스 | 5분 런 | 실시간의 100배 이상(3초) | Vitest 시간 | — |

## 6. 수익화·분석·런타임 AI
없음. 로컬 로그(입력·이벤트)만 파일로 남기고 외부 전송 없음. 게임 실행 중 생성형 AI 없음.

## 7. 개발 환경과 실행 명령 (planned — 개발 세션이 구현 후 실제 값으로 갱신)

| purpose | 디렉터리 | 명령 | 입력 | 출력 | 통과 조건 |
|---|---|---|---|---|---|
| setup | 저장소 루트 | `npm ci` | package-lock.json | node_modules | 오류 없음 |
| run(dev) | 루트 | `npm run dev` | — | Vite 서버 + Electron 창 | 창이 뜨고 타이틀 표시 |
| test | 루트 | `npm test` | — | Vitest 결과 | 전부 통과 |
| sim-bot | 루트 | `npm run sim -- --wpm 40 --reaction 0.7 --policy abbr-first --seeds 20` | 파라미터 | 통계 JSON(생존 시간, 클리어율, 사망 원인) | 실행 완료 |
| replay | 루트 | `npm run replay -- <file>` | 기록 파일 | 결과 해시 | 기록의 해시와 일치 |
| assets:placeholder | 루트 | `npm run assets:placeholder` | asset_contract.json | assets/placeholder/* + manifest | 검사 통과 |
| assets:import | 루트 | `npm run assets:import -- delivery/` | 디자인 납품 | 검사 보고서, 적용 manifest | 실패 항목 보고 |
| capture | 루트 | `npm run capture -- --scene hud --fixture pilot` | fixture | PNG 1280×720 | 파일 생성 |
| build | 루트 | `npm run build && npm run package:win` | — | dist/SHORTHAND-Setup.exe 또는 폴더 | 새 폴더에서 실행 |

fixture: `fixtures/pilot_hud.json`(플레이어 (5,5), 잔병 (4,5) 시전 1.8초, 조각 (6,6), 축약 A01) 등 대표 장면 진입. 내부 상태 조회는 개발 모드 콘솔 `window.__sim.state()`.

## 8. QA 사례

| test_id | 대상 | 목적 | 초기 상태·입력 | 기대 | 절차 | 통과 기준 | 심각도 |
|---|---|---|---|---|---|---|---|
| T-SIM-01 | RQ-09 | 재현성 | 시드 3종, 기록 재생 | 동일 상태 해시 | 자동 | 100% 일치 | 치명 |
| T-SIM-02/03 | S-01, S-02 | 동시 도착 우선순위 | 시나리오 | 기대 이벤트 순서 | 자동 | 일치 | 치명 |
| T-PARSE-01~03 | S-06~08 | 미보유·접두어·공백 | 버퍼 | 실행 여부 | 자동 | 일치 | 치명 |
| T-CANCEL-01 / T-CHASER-01 | S-03, S-04 | 취소·추적 | 시나리오 | — | 자동 | 일치 | 높음 |
| T-GUARD-01 / T-HIT-01 / T-ATTACK-01 | R-GUARD, R-DAMAGE-ORDER | — | 시나리오 | — | 자동 | 일치 | 높음 |
| T-LEVEL-01/02, T-OFFER-01 | S-10, R-OFFER | 다중 레벨업, 후보 규칙, 첫 화면 고정, 축약 2+성능 1 | 시드 20 × 레벨업 전부 | 규칙 위반 0 | 자동 | 0건 | 높음 |
| T-DIFF-01 | R-DIFFICULTY | M(t) 표 일치 | t=0..300 | 표 값 ±0.001 | 자동 | 일치 | 중 |
| T-SPAWN-01/02, T-GEN-01 | R-SPAWN | 상한·간격·고정 예제 | 시드 3 | 20회 스폰 일치 | 자동 | 일치 | 중 |
| T-BOSS-01~03 | R-BOSS | 등장 조건, 회복 창, 체력 | 시나리오 | — | 자동 | 일치 | 높음 |
| T-DEATH-01 / T-CLEAR-01 | R-DEATH, R-CLEAR | 종료 우선순위 | — | — | 자동 | 일치 | 치명 |
| T-SKILL-01 | S-11 | 쿨다운 | — | — | 자동 | 일치 | 중 |
| T-SIM-BOT | 6절 난이도 | 25/40/60 WPM × 정책 3 × 시드 20 | 통계 | 허용 범위 안 | 자동 | 보고서 | 높음(튜닝 근거) |
| T-SIM-BOT-DODGE | 무한 회피 | 이동만 정책 | 3분 내 사망 | 자동 | 100% | 높음 |
| T-INPUT-01/02 | S-15, 포커스 | IME·포커스 | 수동(Windows 한글 IME) | 정지·안내·재개, 조합 문자 미반영 | 수동 | 관찰 기록 | 치명 |
| T-INPUT-03 | 키 반복 | 키 누른 채 유지 | 반복 이벤트 무시 | 수동 | 1글자만 | 높음 |
| T-UI-01 | RQ-01 | 링 가독성 | fixture 4방향 시전 캡처 | 5초 내 순서 판독(사용자 3명) | 수동 | 80% | 높음 |
| T-UI-02~09 | UI_UX | 화면별 행동 | 각 화면 | UI_UX 4·6절 | 자동+캡처 | 기대 일치 | 중 |
| T-ASSET-01/02 | 임포트·교체 | 검사기, 부분 납품 | 샘플 납품(프레임 1개 누락, 피벗 틀림, 버전 불일치) | 각각 검출·placeholder 유지 | 자동 | 검출 100% | 높음 |
| T-AUDIO-01 | 큐 | 트리거·동시 수·토글 | 이벤트 주입 | 재생 로그 | 자동 | 일치 | 중 |
| T-SAVE-01 | save | 손상 복구·원자성 | 손상 파일 | 기본값·백업 | 자동 | 일치 | 중 |
| T-E2E-01 | 전체 | 타이틀→런→레벨업→사망→결과→재도전 | 실제 입력 스크립트 | 화면 전이·캡처 | 자동(Playwright) | 완주 | 높음 |

테스트용 기능(F3 개발 모드, fixture 진입, 시뮬 봇)은 출시 빌드에서 비활성.

## 9. 출시·운영
MVP는 비공개 시험 배포(zip 또는 설치 파일을 8~12명에게 직접 전달). 스토어·서명·연령·개인정보 항목은 첫 출시 단계에서 작성. 시험 데이터(로컬 로그)는 참가자 동의 후 수동 수집. 운영 N/A.
