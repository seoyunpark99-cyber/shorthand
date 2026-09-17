# START_DEVELOPMENT — SHORTHAND MVP 개발 세션 시작 프롬프트

아래 블록을 새 대화의 첫 메시지로 붙여 넣고 `DEV_HANDOFF.zip`을 첨부하세요. 이 프롬프트는 스킬 호출 없이 쓰는 일반 지시입니다. 받는 세션에는 **코드 실행·파일 생성·명령줄 빌드 능력**이 필요합니다(예: Claude Code 또는 Codex 같은 코딩 에이전트 환경). 그 능력이 없으면 세션은 시작 시 멈추고 알려야 합니다.

---

첨부한 개발 인계 패키지 `DEV_HANDOFF.zip`을 읽고 게임 **SHORTHAND MVP (project_id: shorthand, spec_version 1.0, contract_version 1.0)** 를 구현하라. 최종 디자인 에셋은 다른 세션이 제작한다. 너는 계약과 호환되는 기본 에셋으로 개발·테스트하고, 나중에 최종 에셋을 같은 키로 교체할 경로까지 구현한다.

## 시작
1. `START_HERE.md` → `PROJECT_CONTROL.md`(결정 DC-01~DC-08) → `GAME_SPEC.md` → `data/*.json` → `shared/*.json` → `TECH_QA.md` → `UI_UX_HANDOFF.md` → `DESIGN_SPEC.md` 7·8절(코드 렌더링 계약) → `JOBS_TRACE.md` 순서로 읽어라.
2. `shared/CONTRACT_HASH.txt`의 sha256이 `shared/asset_contract.json`과 일치하는지 확인하라. 데이터 파일 머리의 spec_version 1.0과 문서의 버전이 맞는지 확인하라.
3. 개발 스택 결정(DC-03): TypeScript, Phaser 4.2.x, Vite, Vitest, Electron. 설치된 Node·npm으로 이 스택을 실제로 실행할 수 있는지 첫 작업에서 점검하라. 버전이 다르면 임의로 진행하지 말고 차이와 영향을 `PROJECT_CONTROL.md` 이슈표에 기록하라. 스택 조사일은 2026-09-17이며 3개월이 지났다면 Phaser·Electron 최신 안정 버전을 다시 확인하고 달라진 점을 기록하라.
4. 이 인계는 신규 개발이다. 기존 코드는 없다. 과거 기획 대화에 접근할 수 있다고 가정하지 마라.

## 진행 단계: 파일럿 먼저
이 인계는 1단계(파일럿)다. 파일럿 세트 `pilot.hud_combat`의 화면 `screen.run.hud`(L-HUD)를 기본 에셋으로 먼저 동작시키고, 교체 경로(manifest 검사·임포트)를 준비하라. 작업 순서는 `JOBS_TRACE.md` 2절: job.dev.01 골격 → 02 sim.core+parser → 03 growth·spawn·difficulty·boss → 04 replay·sim.bot → 05 assets.resolver·placeholder·검사기 → 06 render·HUD·VFX → 07 input.layer → 08 screens·save·audio → 09 파일럿 교체·반환.

디자인 세션의 파일럿 납품(`delivery/` 폴더와 manifest)이 도착하면 `npm run assets:import`로 교체해 넣고 다음을 반환하라: 실행 방법 또는 실행물, 교체 전후 실제 크기(1280×720) 캡처와 가능하면 짧은 녹화, 임포트 검사 보고서, 교체 중 발견한 문제(판정·레이아웃·성능), 그리고 `FROM_DEV.md`. 이 교체는 판정용 확인이며 최종 통합이 아니다.

파일럿 반환 후에도 판정에 영향받지 않는 작업은 계속하라. **판정까지 보류할 작업**: job.dev.06 중 링 반지름·타일 표시 크기·몸체 표시 크기 등 `shared/asset_contract.json`·`shared/ui_tokens.json`의 수치에 기대는 최종 배치 확정, job.dev.08 중 레벨업 카드 패널(9-slice)·아이콘 배치 확정, job.dev.10·11 전부. 구현 자체는 진행하되 수치는 토큰 파일에서 읽게 하라. 3단계는 기획 세션의 이어가기 인계를 받은 뒤 시작한다.

## 개발 범위
- `GAME_SPEC.md` 2절의 상태·행동·규칙·스텝 순서·이벤트와 3절 시나리오 16개를 그대로 구현하라. 같은 입력의 결과를 추측하지 마라. 문서에 없는 규칙이 필요하면 `PROJECT_CONTROL.md` 이슈표에 적고 가장 보수적인 해석으로 진행하되 그 해석을 기록하라.
- 시뮬레이션(`sim.core`)은 렌더·오디오·DOM에 의존하지 않는 순수 모듈로 만들어라. `npm test`와 `npm run sim`(가상 플레이어 시뮬)이 헤드리스로 돌아야 한다. 이것이 이 프로젝트에서 튜닝을 사람 손 없이 반복하기 위한 핵심 요구다.
- 밸런스 파라미터(`GAME_SPEC.md` 6절)는 허용 범위 안에서 봇 시뮬 결과를 근거로 조정할 수 있다. 조정한 값·근거·시뮬 보고서를 `PROJECT_CONTROL.md` 변경표에 기록하라. 허용 범위 밖 변경은 변경 요청으로 기획 세션에 보내라.
- 제품 방향·그림체·공통 계약을 새로 정하지 마라. 최종 그림·음원이 없다는 이유로 기본 에셋으로 가능한 작업을 멈추지 마라.
- 공통 계약의 `binding_key`·`asset_id`·`clip_id`·`frame_id`·`cue_id`를 코드에서 쓰고, 실제 파일 경로는 `assets/manifest.json`(기본)과 `delivery/manifest.json`(납품)에만 두어라.
- 기본 에셋은 `shared/asset_contract.json`의 placeholder_policy대로 스크립트로 생성하라(캔버스 112/160/64px, 피벗, 프레임 수, 큐 길이 동일). 임시 도형 모양에 맞춰 판정·레이아웃·시간을 바꾸지 마라. F3 개발 모드로 asset_id와 placeholder 여부를 표시하라.
- 애니메이션은 manifest의 프레임 순서·duration을 쓰고 사람용 1-based 프레임 번호(f0001)를 엔진 인덱스와 정확히 매핑하라. 판정은 50ms 스텝의 시뮬레이션이 권위이며 렌더 프레임 누락으로 빠지거나 중복되지 않게 하라.
- UI는 `UI_UX_HANDOFF.md`의 8화면 전부를 실제 데이터·행동·상태·실패 처리와 함께 구현하라. `shared/ui_tokens.json`과 `shared/strings.json`을 런타임에 읽어 색·레이아웃·카피를 적용하라(하드코딩 금지). 화면 이름·더미 값·빈 핸들러로 화면 완료를 처리하지 마라.

## 교체 경로
`assets.resolver`가 디자인 manifest를 읽어 project_id·contract_version 일치, ID·의존성, 파일 존재·sha256·크기·알파, 프레임 수·순서, 9-slice inset, 오디오 길이·샘플레이트를 검사하게 하라. 실패 항목은 placeholder를 유지하고 보고하라. 허용되지 않은 크기 조정·트리밍으로 오류를 숨기지 마라. 기본 manifest와 납품 manifest를 바꿔도 게임 규칙 코드가 바뀌지 않아야 한다. 부분 납품은 교체 단위(asset / batch / cue / font)별로 적용하고, 적용 전후 manifest와 복귀 방법을 기록하라.

## 검증과 반환
- `TECH_QA.md` 8절의 테스트를 구현·실행하고, 각 요구(RQ-01~11)의 수락 조건을 실제 입력·기대/관찰 결과·증거에 연결하라. 수동 항목(T-INPUT-01 한글 IME, T-UI-01 링 가독성)은 절차와 관찰을 기록하고 not_run이면 그렇게 남겨라.
- 실제 반환할 ZIP을 새 폴더에 풀어 `TECH_QA.md` 7절 명령(setup/run/test/sim/replay/assets/capture/build)이 README 안내만으로 동작하는지 확인하라. 원래 작업 폴더·숨은 생성물에 의존하지 마라. ZIP 해시는 ZIP 밖 보고서에 두어라.
- 검사 인덱스에 현재 입력 버전·해시·run_id·증거 경로·유효 여부를 기록하고 과거 결과와 섞지 마라.
- 반환물: 기본 에셋으로 실행 가능한 결과, 작업표 진행 상태, 실행·테스트·빌드·임포트 방법, 최종 에셋을 넣을 위치와 manifest 계약, 검증 증거, 봇 시뮬 보고서. 공통 계약 변경이 필요하면 변경 ID·이유·영향·대안을 기록하고 영향 없는 개발은 계속하라.
- 합격 기준을 낮추거나 실패 테스트를 삭제해 완료 처리하지 마라. 개발 완료 후 디자인 제작·배포 등 다음 트랙을 자동 착수하지 마라.

## 인계 문서 피드백 (게임 반환물과 별도)
파일럿 반환과 최종 반환 때, 게임 반환물과 **별도 파일** `FROM_DEV.md`로 인계 문서 자체에 대한 피드백을 돌려줘라. 이 파일은 기획 세션이 인계 양식을 고치는 데 쓰며 게임 판정에는 쓰지 않는다. 적을 것: 인계 문서에 없어서 추측으로 채운 값과 어느 문서 어느 절에 있었어야 했는지 / 문서끼리 모순되거나 같은 값이 다르게 적힌 곳 / 읽는 순서가 헷갈렸거나 늦게 발견한 문서 / 기본 에셋 계약·교체 경로 지시 중 그대로 구현할 수 없었던 것과 이유 / 특히 잘 작동해서 그대로 두었으면 하는 지시. 각 항목에 근거(파일명·절·job_id)를 붙여라. 게임 규칙 변경 요청은 여기가 아니라 변경 요청 절차로 보내라.
