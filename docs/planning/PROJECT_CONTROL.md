# PROJECT_CONTROL — shorthand

## 1. 프로젝트 프로필

| 필드 | 내용 |
|---|---|
| 식별 | project_id shorthand · 표시 이름 SHORTHAND(속기) · spec_version 1.0 · contract_version 1.0 · 기준일 2026-09-17 |
| 작업 방식 | 신규 개발. 기존 게임 프로젝트 없음(코드 없음). 계승: 01 세션의 GAME_CONCEPT_0 v0.1(LOCKED_0 D-01~D-05), v1.3 기획총합본의 문법·카드·적 패밀리·세계관·표현(참조), JSON 데이터 구조(참조) |
| 목표 | 타이핑 게임의 손맛과 서바이버류 성장을 아는 PC 플레이어. 재미의 원천: 게이지 안에 명령을 완성하는 긴박함과 축약으로 언어가 짧아지는 성장. 대표 플레이 GAME_SPEC 1절. 이번 범위: MVP 5분 압축판 + 보스 1패턴 |
| 제약 | Windows PC, 물리 키보드 영문, 1280×720 16:9, 한국어 UI. 팀 1인 + 코딩 에이전트 + 생성 서비스. 일정·예산 미정 |
| 분야 선택 | 2D / 프레임 최소(대기 2·시전 1) + 코드 모션 / 오프라인 / 서사 최소 / 생성기는 스폰·카드 후보만 / 계정·수익화 없음(MVP) |
| 스택 | 개발 DC-03 (TS+Phaser 4+Electron), 디자인 DC-04 (혼합), 조사일 2026-09-17, 스냅숏 TOOL_SNAPSHOT_2026-09.md, 재확인 3개월 |
| 수행 환경 | 기획 세션: 파일 읽기·쓰기·웹 조사·코드 실행 가능, 이미지 생성 불가. 개발 세션: 코드 실행 에이전트(예: Claude Code). 디자인 세션: SVG 작성 가능한 에이전트 + gpt-image-2.5 + ElevenLabs(사용자 계정 필요, 미확인) |
| 기준 그림 | 승인된 시각 기준 없음 → DC-05: 디자인 파일럿 첫 작업으로 제작, 사용자 승인 후 동봉 |
| 권한 | 사용자 결정: 방향·스택·기준 그림 승인·파일럿 판정. 위임(DC-06): D~F 세부 수치·규칙·에셋 목록·기술 구조. 허용 시안: 기준 그림 2~3안. 외부 준비: gpt-image API 조직 인증, ElevenLabs Starter 구독 |
| 완료 목표 | 기획 완료 = FINAL_REVIEW G01~G27 통과 + DC-08 사용자 일괄 승인. 후속: 파일럿 제작(1) → 판정(2) → 전수(3) → 통합(4). 차단 사항: 없음(외부 계정은 디자인 세션 시작 시 확인) |
| 제작 단계 | 현재 0 기획. pilot_set_id pilot.hud_combat. 판정 결과 없음 |
| 단계 경계 | active_track 기획. 허용: 명세·계약·브리프·프롬프트 생성. 금지: 코드 구현·에셋 제작. 종료 조건: 인계 전달 후 정지. 후속 착수 권한: 사용자가 각 세션을 직접 연다 |
| 기록·피드백 | 루트 `개발/SHORTHAND-기획프로젝트/`. 00_log/CONVERSATION_LOG.md (agent-written, hook 없음). feedback/FEEDBACK_LEDGER.md. 받은 FROM_*.md: 없음. FEEDBACK_TO_02.md 초안(인계 직후 작성), FEEDBACK_TO_01.md 7절 완성(동시). 이 파일들은 ZIP에 넣지 않음 |

## 2. 입력 감사

| source_id | 파일 | 버전·조회 | 종류 | 읽은 범위 | 미열람 | 관련 요구 | 지위 |
|---|---|---|---|---|---|---|---|
| SRC-01 | 01_ideation/GAME_CONCEPT_0.md | v0.1 APPROVED_0, 2026-09-17 | 0차 기획 | 전체 | — | RQ-01~11 | 기준 |
| SRC-02 | 01_ideation/START_DETAILED_PLANNING.md | 2026-09-17 | 시작 지시 | 전체 | — | — | 기준 |
| SRC-03 | SHORTHAND-게임개발-기획총합본-v1.3.md | v1.3 2026-09-16 | 기존 기획 | 1·2부 전체, 3부 전체, 4부 전체, 5부 전체 | 부록(JSON과 동일) | 문법·카드·적·보스·표현 | 참조(시간 모델·3막·일정 제외) |
| SRC-04 | SHORTHAND-시제품-기획데이터.json | 2026-09-16 | 데이터 | 전체 | — | 데이터 구조 | 참조(틱 절대값 제외) |

요구사항표는 GAME_SPEC 8절(RQ-01~11)과 JOBS_TRACE 4절이 원본이다.

## 3. 결정 카드

| decision_id | 제목 | 상태 | 선택 | 권한자·근거 | 일시 | 영향 | 재검토 조건 |
|---|---|---|---|---|---|---|---|
| DC-01 | 제작 체제·도구 | approved_by_user | 1인, 코드 Claude Code, 이미지·오디오는 조사 후 선택 | 턴 12 | 스택 후보 범위, 파일럿 규모 | 팀 변화 |
| DC-02 | B 단계 범위·대표 플레이 | approved_by_user (0차 계승) | GAME_CONCEPT_0 7·10절 | D-05·D-07 | — | — |
| DC-03 | 개발 스택 | approved_by_user | TS + Phaser 4 + Vite + Vitest + Electron | 턴 13 | TECH_QA 전체, 계약 형식 | T-INPUT-01 실패, 입력 지연 >100ms |
| DC-04 | 디자인 스택 | approved_by_user | 혼합(vector/raster/audio/library/code), 파일럿은 벡터 | 턴 13 | 제작 방식·브리프 형식 | 파일럿 판정 |
| DC-05 | 기준 그림 | approved_by_user | 디자인 파일럿 첫 작업, 사용자 승인 | 턴 13 | job.pilot.ref_shot | — |
| DC-06 | D~F 세부 위임 | approved_by_user | 세션이 정하고 일괄 요약 승인 | 턴 13 | DC-07 항목 전부 | — |
| DC-07 | D~F 세부 결정 묶음 (decided_under_delegation) | decided_under_delegation | 아래 7-a~7-l | DC-06 | GAME_SPEC·DESIGN_SPEC·TECH_QA | DC-08에서 사용자가 개별 수정 가능 |
| DC-08 | 상세 기획 일괄 승인 | approved_by_user | DC-07 전체와 게이지 하한 조정 위임, 외부 준비 안내 수용 | 턴 15 "승인, FINAL_REVIEW와 ZIP 진행" | 2026-09-17 | FINAL_REVIEW·ZIP 생성 | 파일럿 판정 |

**DC-07 위임 결정 목록과 이유**

| 번호 | 결정 | 선택 값 | 이유 |
|---|---|---|---|
| 7-a | 시간 모델 | 50ms 고정 스텝, 입력은 다음 스텝 처리, 완성과 만료 동시면 플레이어 우선 | 재현성과 "마지막 글자에 살아남는" 경험 보존(v1.3 규칙 계승) |
| 7-b | 게이지 곡선 | 잔병 6.0/속사병 3.0/추적자 6.0초 × M(t)=max(0.30, 0.88^floor(t/30)) | 0차 계산 시험: 40 WPM이 첫 긴 명령 3.3초+반응 1초를 6초 안에 완성. 끝 1.8초는 `s4`급 축약 전제 |
| 7-c | XP 곡선 | 3+(L−1), 5분 6~9회 레벨업 | 축약 주식이 6회 이상 체감되게 |
| 7-d | 카드 풀 | 14종(축약 9, 성능 5), 첫 화면 A01/A03/A06 고정, 슬롯 1·2 축약(동작/방향 다르게), 3 성능 | D-02와 "세 방향 소개" 양립 |
| 7-e | 적 3종 + 보스 | 잔병·속사병·추적자, 거병은 첫 출시로. 보스 HP 14, 삭제선 2단 + 회복 3초 | 0차 MVP 목록. 거병(부채꼴)은 방향 판정 종류를 늘려 MVP 검증 질문과 무관 |
| 7-f | 스폰 | 밴드 5개, 간격 6→3.5초, 상한 2→4, 거리 4 링, 예고 1초 | 처치 30~50마리, 무한 회피는 누적으로 억제(D-04) |
| 7-g | 스킬 | 회전베기 1종(A10), 쿨다운 4초, 슬롯 1 | "새 스킬" 계열이 카드에 존재하되 MVP 최소 |
| 7-h | 보드·HUD 규격 | 1280×720, 타일 56px, 몸체 원본 112px, 링 반지름 88px | 링·게이지·명령창이 한 화면에 들어가는 최소 규격. 파일럿에서 검증 |
| 7-i | 에셋 제작 방식 | 파일럿 전부 벡터(기준 그림 제외), 판정 후 몸체 raster 검토 | DC-04 |
| 7-j | 애니메이션 | 대기 2프레임 + 시전 1프레임, 나머지 코드 모션 | 축약 후 빠른 연속 입력이 모션에 막히지 않게(v1.3 원칙) |
| 7-k | 오디오 | 16큐, 음악 없음, ElevenLabs Starter 이상 | MVP 범위·상업 조건 |
| 7-l | 저장·기록 | 설정·기록 로컬 JSON, 런 중 저장 없음, 입력 기록 재생 | D-03, 재현성 |

## 4. 이슈·변경

| issue_id | 종류 | 내용 | 영향 | blocking_gate | 담당 | 상태 |
|---|---|---|---|---|---|---|
| IS-01 | 외부 준비 | gpt-image API 조직 인증, ElevenLabs Starter 구독이 사용자 계정에 있는지 미확인 | 디자인 파일럿 시작 | 아니오(디자인 세션 시작 시 확인) | 사용자 | open |
| IS-02 | 기술 미확인 | Windows 한글 IME에서 compositionstart 동작, Phaser 4 한글 Text 품질 | DC-03 재검토 조건 | 아니오(job.dev.01에서 확인) | 개발 세션 | open |
| IS-03 | 밸런스 미검증 | 게이지·스폰·XP 값은 시뮬·플레이 시험 전 | 재미 판단 | 아니오(허용 범위 안 조정 위임) | 개발 세션(봇), 사용자(시험) | open |
| IS-04 | 도구 미확인 | SVG 래스터화 도구(resvg 등) 설치 가능 여부 | 디자인 파일럿 | 아니오 | 디자인 세션 | open |
| IS-05 | 정책 | 두 ZIP의 shared 해시 동일 유지 | 통합 | — | 기획 | 인계 시 확인 |

변경표: 없음(초판).

상태 축: spec=approved(DC-08) · production=not_started · verification=not_run.

## 5. 조사 기록
STACK_DECISION.md 5절.

## 6. 작업·증거·재개
작업표·추적: JOBS_TRACE.md. 증거표: 없음(not_run).

**재개 블록**
- 현재 버전: spec 1.0, contract 1.0, 기준 파일 02_planning/ (이 폴더)
- 방향 근거: GAME_CONCEPT_0 D-01~D-07, 이 문서 DC-01~DC-07
- 완료한 작업: A~G 문서 작성. 실제 검사 범위: 문서 검사(FINAL_REVIEW_RESULT.md)만
- 진행 중·미완료: DC-08 사용자 승인 → ZIP 생성 → 인계. 외부 준비 IS-01
- 다음 첫 작업: 개발 job.dev.01, 디자인 job.pilot.ref_shot
- 환경·명령: TECH_QA 7절(planned)
- 현재 트랙 기획, 종료 조건 인계 전달, 후속 착수는 사용자
- 마지막 변경: 초판
- 제작 단계 0, pilot.hud_combat, 판정 대기 반환물: 디자인 파일럿 납품 ZIP + FROM_DESIGN.md, 개발 파일럿 반환(캡처·임포트 보고) + FROM_DEV.md
- 기록: 00_log/CONVERSATION_LOG.md(agent-written), feedback/FEEDBACK_LEDGER.md open 항목 수는 인계 시점에 기록. 받지 못한 FROM_*: 전부
