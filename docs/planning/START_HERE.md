# START_HERE — SHORTHAND MVP 기획 기준본

- project_id: shorthand · 표시 이름: SHORTHAND(속기) · spec_version **1.0** · contract_version **1.0** · 기준일 2026-09-17
- 상태: 기획 완료(FINAL_REVIEW 통과, `FINAL_REVIEW_RESULT.md`), production=not_started, verification=not_run
- 제작 단계: 0 기획 → **1 파일럿 제작(지금)** → 2 판정(기획 세션 재진입) → 3 전수 제작 → 4 통합
- 이번 결과의 범위: **MVP 5분 압축판 + 보스 1패턴.** 제품이 아니라 "빨라지는 적 vs 짧아지는 명령의 맞붙음이 재미있는가"를 확인하는 검증 도구다. 첫 출시·확장 층은 `GAME_SPEC.md` 9절과 `01_ideation/GAME_CONCEPT_0.md` 10절.

## 읽기 순서

| 담당 | 순서 |
|---|---|
| 개발 세션 | PROJECT_CONTROL → GAME_SPEC → data/ → shared/ → TECH_QA → UI_UX_HANDOFF → DESIGN_SPEC 7·8절 → JOBS_TRACE → prompts/START_DEVELOPMENT |
| 디자인 세션 | DESIGN_SPEC 1~3절 → shared/asset_contract·ui_tokens → briefs/pilot → JOBS_TRACE 1절 → prompts/START_DESIGN |
| 기획 세션(재개) | PROJECT_CONTROL 재개 블록 → JOBS_TRACE → 반환물 |

## 파일 구성

| 파일 | 역할 |
|---|---|
| PROJECT_CONTROL.md | 프로필·입력 감사·결정 카드 DC-01~08·이슈·재개 블록 |
| GAME_SPEC.md | 제품 정의·상태·행동·규칙·스텝 순서·이벤트·시나리오 16·콘텐츠·튜토리얼·파라미터·난이도·UX 연결 |
| data/commands.json, cards.json, enemies.json, gauge_and_spawn.json | 수치의 단일 원본 |
| shared/asset_contract.json | 에셋·클립·프레임·합성·바인딩·오디오 큐·기본 에셋 정책의 단일 원본 |
| shared/ui_tokens.json, strings.json | 색·타이포·레이아웃 토큰, 카피 65개 |
| shared/CONTRACT_HASH.txt | asset_contract.json의 sha256 |
| shared/DELIVERY_MANIFEST.template.json | 디자인 납품 manifest 양식(미완성 양식, 승인 명세 아님) |
| UI_UX_HANDOFF.md | 화면 8·레이아웃·컴포넌트·행동·접근성·검수 |
| DESIGN_SPEC.md | 적용성·아트 바이블·공통 스타일 문단·전수 집계·유형별 요구·VFX·애니메이션·오디오 |
| briefs/pilot/ (9) · briefs/phase3/ (3) | 에셋별 만드는 지시·규격 맞추는 지시 |
| TECH_QA.md | 모듈·데이터·저장·기본 에셋·성능·명령(planned)·테스트·시험 배포 |
| STACK_DECISION.md · TOOL_SNAPSHOT_2026-09.md | 스택 조사·결정·제약→규칙·호환 확인, 새 스냅숏 |
| JOBS_TRACE.md | 파일럿 세트 pilot.hud_combat, 작업표, 요구 추적, 보류 목록 |
| prompts/ | START_DEVELOPMENT, START_DESIGN, INTEGRATE(초안), RESUME_PLANNING |
| FINAL_REVIEW_RESULT.md | G01~G27 검수 결과 |

## 완료·미실행
- 완료: 문서·데이터·계약·브리프·프롬프트 작성, 문서 간 ID·색값 기계 대조.
- 미실행(후속 세션): 모든 코드·테스트·시뮬·에셋 제작·플레이 시험·IME 확인·패키징.
- 외부 준비(사용자): gpt-image API 조직 인증, ElevenLabs Starter 이상 구독. 없으면 해당 에셋만 보류.

## 다음 작업
- 개발: job.dev.01 (골격·스택 확인·IME 확인)
- 디자인: job.pilot.ref_shot (기준 그림 2~3안 → 사용자 승인)
- 두 세션의 파일럿 반환물이 도착하면 기획 세션에서 판정(prompts/RESUME_PLANNING.md).
