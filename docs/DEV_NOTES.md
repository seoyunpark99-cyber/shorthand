# DEV_NOTES — 개발 세션 변경표·이슈·검사 인덱스 (spec 1.0 / contract 1.0)

작성일 2026-09-17. PROJECT_CONTROL.md 변경표·이슈표의 개발 세션 갱신분.

## 1. 변경표

| change_id | 종류 | 내용 | 근거 | 허용 범위 안? |
|---|---|---|---|---|
| CR-01 | 규칙 해석 | 보스 삭제선 시전 시간에 `difficulty_floor: 1.0` 적용(= 보스는 M(t) 미적용). enemies.json boss.behavior 에 필드 추가 | 270초 M=0.316(원안)·0.472(CR-02 후)이면 step1 0.76~1.1초, step2 0.47~0.7초. 봇(25~60 WPM) 전원이 3연속 피격으로 사망. 회피 불가 패턴은 검증 질문과 무관 | **밖** (파라미터 표에 없음) → 기획 세션 확인 요청. 되돌리려면 필드 삭제 |
| CR-02 | 밸런스 | `decay 0.88 → 0.92`, 밴드 4·5 `max_alive 4 → 3` | 봇 시뮬 20시드: 40 WPM abbr-first 3분 생존 0% → 45%, 60 WPM 65% → 90%. 원안은 25/40 WPM 모두 3분 생존 0% | 안 (0.85~0.92, ±1) |
| CR-03 | 스택 | Electron 패키징 생략, 웹 정적 배포(GitHub Pages + 아티팩트). 저장은 localStorage | 사용자 결정(웹에서 계속 테스트) | 사용자 결정 |
| CR-04 | 스택 | Node 24.15 / Vite 8 / Vitest 5 / TS 7 (TECH_QA 는 Node 22·Vite 6 가정). 동작 확인됨. CI는 Node 22 | 환경 | — |

봇 시뮬 결과(CR-02 적용 후, 20시드, 정책 abbr-first): 25 WPM 평균 67초 · 40 WPM 평균 173초(3분 45%) · 60 WPM 평균 232초(3분 90%, 클리어 10%) · 60 WPM perf-first 3분 70% · dodge-only 평균 64초(3분 이내 사망 100% ✔). GAME_SPEC 6절 목표(40 WPM 클리어 40%)에는 **미달**. 봇은 반응 고정·1명령씩 결정하는 단순 정책이라 사람보다 약하다. 최종 판단은 사람 시험(IS-03 유지).

## 2. 이슈표 갱신

| issue_id | 내용 | 상태 |
|---|---|---|
| IS-02 | Windows 한글 IME compositionstart: 코드는 `compositionstart`/`keydown.isComposing`/`keyCode 229` 세 경로로 감지해 정지·안내. **실기기 수동 확인 not_run** | open (사용자 시험) |
| IS-03 | 밸런스: 1절 참조 | open |
| IS-06 | `m 6.` 표기: GAME_SPEC·strings(tut.03) 는 마침표가 있으나 commands.json 은 숫자 축약에 마침표 없음(S-08 `s4` = 2자). 구현은 데이터를 따름(`m 6`). tut.03 문구는 원문 유지 | 기획 확인 요청 |
| IS-07 | 보스 정렬: "거리 2 정렬" 을 목표 칸(±2 행/열)으로 이동하되, 같은 행/열 거리 1~3 이면 패턴 시작으로 해석(플레이어 이동으로 정렬이 어긋나도 진행되도록) | 보수적 해석 기록 |
| IS-08 | 보스 step2 막기 방향: 직선이 플레이어 칸을 관통하므로 막기 방향이 step1 축 또는 보스 방향이면 막힘으로 처리 | 보수적 해석 기록 |
| IS-09 | 아이콘·몸체·타일·카드 패널·오디오 전부 placeholder(코드 생성 도형, WebAudio 비프). 디자인 납품은 manifest 로 교체 | 파일럿 대기 |

## 3. 검사 인덱스 (run 2026-09-17, 입력 spec 1.0, contract hash 5ead2c37…)

| test_id | 상태 | 증거 |
|---|---|---|
| T-PARSE-01~03, T-SIM-02/03, T-CANCEL-01, T-CHASER-01, T-GUARD-01, T-DEATH-01, T-LEVEL-01, T-OFFER-01(첫 화면 고정), T-SKILL-01, T-SPAWN-01, T-BOSS-01~03, T-CLEAR-01, T-INPUT-01(sim 측 정지 규칙), T-SIM-01, T-DIFF-01 | pass | `npm test` 33/33 (tests/scenarios.test.ts, parser.test.ts) |
| T-SIM-BOT, T-SIM-BOT-DODGE | run | `npm run sim` 1절 |
| T-E2E-01 | pass | `npm run e2e` 타이틀→런→일시정지→설정→레벨업→사망→결과→기록, captures/ |
| T-UI-01~09 | 캡처만 | captures/fixture_pilot_hud.png (사람 판독 not_run) |
| T-INPUT-01/02/03 실기기 | not_run | 수동 |
| T-ASSET-01/02 | 부분 | 버전·크기 검사만. sha256·프레임 수·9-slice inset·오디오 길이 검사 미구현 |
| T-SAVE-01 | 부분 | 손상 JSON → 기본값 복원 코드 경로, 자동 테스트 없음 |
| T-AUDIO-01 | 부분 | 동시 수·토글은 `audioLog` 로 기록, 자동 테스트 없음 |
| 성능 | not_run | — |

## 4. 남은 작업 (JOBS_TRACE 대비)
- job.dev.05 검사기 고도화(sha256·프레임·inset·오디오), job.dev.09 디자인 파일럿 임포트, job.dev.10 패키징(보류), job.dev.11 시험 준비.
