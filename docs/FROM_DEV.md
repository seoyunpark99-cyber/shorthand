# FROM_DEV — 인계 문서 피드백 (파일럿 반환, 2026-09-17)

게임 판정용이 아니라 기획 세션이 인계 양식을 고치는 데 쓰는 파일이다.

## 추측으로 채운 값
- 보스 삭제선에 난도 배율을 적용하면 회피 불가(0.5~1초). enemies.json boss.behavior.difficulty_multiplier 가 "적용한다"고만 적혀 있고 GAME_SPEC 6절 파라미터 표에 보스 시전 시간이 없어 허용 범위 밖 변경(CR-01)이 필요했다. → 6절에 P-BOSS-CAST 행(범위·목표)이 있었어야 한다.
- 보스 정렬(enemies.json align_rule)이 플레이어 이동 뒤 어긋났을 때의 처리(IS-07), step2 막기 방향(IS-08)은 GAME_SPEC 2.4 R-BOSS 에 없었다.
- 피격 원인의 "명령 미완성(typed/total)" 에서 total 의 정의(버퍼가 비었을 때·유효 접두어가 아닐 때)가 strings.json 에만 변수로 있고 규칙이 없었다 → GAME_SPEC 2.6 ev.player_hit 속성에 정의 필요.
- 스폰 첫 시도 시각(0초 vs interval 뒤)이 명시되지 않아 `interval_s` 뒤로 두었다.

## 문서끼리 다른 곳
- `m 6.` (GAME_SPEC 1절·S-03·tut.03) vs commands.json 숫자 축약에 마침표 없음(S-08 `s4`=2자). 데이터를 따랐다(IS-06).
- TECH_QA 1절 "Node 22 LTS / Vite 6" 과 실제 환경(Node 24 / Vite 8). 버전 고정 방침이 필요하면 package.json engines 로.

## 읽는 순서
- DESIGN_SPEC 7·8절(코드 렌더링 계약)을 UI_UX_HANDOFF 보다 먼저 읽는 편이 HUD 구현에 유리했다. 링·명령창·사이드 패널의 실제 좌표는 ui_tokens.layout_1280x720 이 원본인데 UI_UX 2절 표에서 그 사실을 늦게 발견했다.

## 그대로 구현할 수 없었던 것
- `npm run assets:placeholder` 로 PNG 파일을 생성하는 대신 런타임에 Phaser Graphics 로 같은 캔버스·피벗의 도형 텍스처를 만들었다(웹 배포에서 파일 산출물이 불필요). 계약의 캔버스·피벗은 동일하게 지켰다.
- 임포트 검사기의 sha256·프레임 수·9-slice inset·오디오 길이 검사는 미구현(버전·캔버스 크기만). 디자인 납품이 도착하는 시점에 붙인다.
- Electron 패키징은 사용자 결정으로 생략.

## 잘 작동해서 그대로 두었으면 하는 지시
- GAME_SPEC 2.5 "한 스텝의 처리 순서" 와 3절 시나리오 16개: 그대로 테스트 케이스가 되었고, 동시 도착·사망 우선·다중 레벨업 같은 경계가 한 번에 정해졌다.
- data/*.json 을 수치 단일 원본으로 두고 본문은 규칙만 적는 방식: 봇 튜닝(CR-02) 이 데이터 파일 수정만으로 끝났다.
- ui_tokens.json / strings.json 런타임 로드 지시: 화면 8개의 색·좌표·카피를 하드코딩 없이 만들 수 있었다.
- 봇 시뮬(RQ-11)을 필수 요구로 둔 것: 5분 런 20회가 0.05초에 돌아 밸런스 문제(보스 회피 불가)를 플레이 전에 발견했다.
