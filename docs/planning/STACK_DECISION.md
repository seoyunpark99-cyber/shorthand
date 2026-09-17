# STACK_DECISION — 개발·디자인 스택 결정 기록

조사일 2026-09-17. 재확인 기준 기간 3개월(2026-12-17 이후 제작 시작이면 3절의 도구 사실을 다시 확인). 새 스냅숏: `TOOL_SNAPSHOT_2026-09.md` (이 파일로 스킬의 스냅숏을 교체할 수 있다).

## 1. 필요한 능력

- 개발: Windows 실행 파일, 2D 격자, 원시 키보드 입력과 IME 차단, 50ms 스텝 시뮬레이션, 로컬 저장, **코딩 에이전트가 직접 실행·검사·시뮬레이션 튜닝**, 텍스트 기반 프로젝트.
- 디자인: 잉크 실루엣 몸체(투명 PNG), 정확한 좌표의 HUD·아이콘·타일(SVG), 한글 글꼴, 짧은 효과음(상업 이용), 스타일 일관성.

## 2. 결정 카드

### DC-03 개발 스택 — approved_by_user (턴 13)
- 선택: TypeScript + Phaser 4.2.x + Vite + Vitest + Electron. 
- 대안: B Godot 4.7.2 + GDScript(네이티브·Steam 쉬움, 에이전트가 실행 결과를 보기 어렵다는 보고, IME 검증 필요) / C Godot + C#(빌드 무거움).
- 이유: 시뮬레이션을 렌더와 분리해 에이전트가 봇 시뮬로 게이지·카드·스폰을 수십 회 튜닝할 수 있다. 브라우저 IME 감지(compositionstart)가 명확하다.
- 비용·라이선스: 전부 MIT 계열 무료. Electron 배포 용량 100MB 안팎.
- 계약 제약: PNG 스프라이트(개별 프레임, 아틀라스 선택), OGG 오디오, 웹폰트(TTF/WOFF2), 9-slice는 Phaser NineSlice 지원.
- 재검토 조건: T-INPUT-01(Windows 한글 IME)에서 compositionstart가 발생하지 않거나, 입력 지연이 100ms를 넘으면 Tauri 또는 Godot 재검토.

### DC-04 디자인 스택 — approved_by_user (턴 13)
- 선택: 유형별 혼합. HUD·아이콘·타일·카드 패널·(파일럿) 몸체 = vector_authored(코딩 에이전트 SVG) / 기준 그림·(판정 후) 몸체·배경 질감 = raster_generated(gpt-image-2.5) / 효과음 = audio_generated(ElevenLabs Starter 이상) / 글꼴 = library_sourced / VFX·HUD 렌더 = code_rendered.
- 대안: B 이미지 생성 통일(HUD 글자·수치 품질 약함, 비용) / C 전부 SVG(잉크 손그림 느낌 포기).
- 이유: 비용 0의 벡터로 규격을 먼저 확인하고, 화풍이 필요한 몸체만 생성 이미지로 교체한다.

### DC-05 기준 그림 — approved_by_user (턴 13)
- 디자인 세션의 파일럿 첫 작업(job.pilot.ref_shot)으로 gpt-image-2.5로 2~3안 제작, 사용자 승인. 승인 전까지 아트 바이블이 유일한 기준.

## 3. 도구 제약 → 계약 규칙

| 도구 사실 (조사 ID) | 계약 규칙 | 적용 에셋 | 문서 |
|---|---|---|---|
| RS-01 gpt-image-2.5는 PNG 출력, SVG 불가 (공식 API 레퍼런스, 2026-09-17) | raster_generated 에셋 원본은 PNG. SVG 요구 금지 | ref.shot.hud, 판정 후 몸체 | shared, 브리프 |
| RS-02 gpt-image-2.5 투명 배경 정식 지원, 임의 해상도(16 배수) (공식) | 투명 PNG 직접 요청 가능. 실패 시 단색(#00FF00) 배경 생성 후 제거하는 대체 후처리를 규격 칸에 둔다 | 판정 후 몸체 | 브리프(3단계 갱신본) |
| RS-03 생성 모델은 글자를 정확히 못 그림 (일반) | 글자 있는 에셋은 생성하지 않음. UI 텍스트는 코드 렌더 | 화면 구성, 카드 | UI_UX, DESIGN_SPEC 7 |
| RS-04 ElevenLabs 무료 플랜은 개인 용도만, Starter부터 상업·API, 최대 30초, MP3 44.1k(Creator 이상 WAV 48k) (공식 페이지) | Starter 이상 필수. 원본이 MP3면 보관 후 WAV 48k로 변환해 납품. 30초 상한은 문제 없음(최대 2.5초) | audio.* | shared.audio_format, 브리프 |
| RS-05 Phaser 4는 PNG·JSON 아틀라스·OGG/MP3·웹폰트 로드, NineSlice 지원 (Phaser 문서 일반) | 런타임 PNG 개별 프레임(아틀라스는 개발이 선택 생성), OGG, TTF/WOFF2, 9-slice inset 기록 | 전부 | shared |
| RS-06 브라우저 IME는 composition 이벤트로 감지 (웹 표준) | 조합 중 문자는 버퍼에 넣지 않고 정지 | input.layer | GAME_SPEC 2.2, TECH_QA |
| RS-07 JetBrains Mono·Pretendard는 SIL OFL 1.1 (라이선스 원문 확인은 디자인 세션 job.pilot.fonts에서 수행) | 라이선스 파일 동봉, 상업 이용 조건 기록 | font.* | 브리프 |
| RS-08 Ludo.ai 상업 이용 조건 미확인 (가격 페이지에 명시 없음) | 채택하지 않음. 재검토 시 약관 원문 확인 | — | — |

## 4. 개발·디자인 호환 확인

- 이미지: 디자인은 PNG(straight alpha, sRGB) 납품 → Phaser 직접 로드. 아틀라스 패킹은 개발 임포트 단계에서 선택(계약은 개별 파일).
- SVG 원본 → PNG 래스터화는 디자인 납품 공정(resvg 또는 Inkscape CLI). 개발은 PNG만 소비.
- 오디오: WAV 48k → OGG q5 변환은 디자인 납품 공정. Phaser는 OGG 재생(Chromium).
- 글꼴: TTF/WOFF2 + CSS @font-face(Electron 내장). Phaser Text가 시스템 폰트 스택을 쓰므로 로드 완료 후 씬 시작(개발 작업 dev.fonts).
- 색공간: 전부 sRGB. 알파 premultiplied 변환은 Phaser가 처리(디자인은 straight로 납품).

## 5. 조사 기록

| research_id | 질문 | 확인된 사실 | 출처·조회일 | 미확인 |
|---|---|---|---|---|
| RS-01/02 | gpt-image 투명·해상도·형식 | 2.5 계열 투명 정식, 16 배수 임의 해상도 최대 3840×2160, png/jpeg/webp, 조직 인증 필요 | developers.openai.com API 레퍼런스 · 이미지 가이드, 2026-09-17 | 가격(가격 페이지 미열람), 한 계정의 일일 한도 |
| RS-04 | ElevenLabs SFX 조건 | 위 표 | elevenlabs.io/sound-effects, 2026-09-17 | 약관 원문(플랜별 권리 조항) |
| RS-09 | Godot 최신 | 4.7.2 stable 2026-08-18, 4.8 dev | github godot-builds releases, 2026-09-17 | — |
| RS-10 | Phaser 최신 | 4.2.1 2026-07-09, 4.0 정식 2026-04-10 | github phaserjs releases, 2026-09-17 | Phaser 4 한글 Text 렌더 품질(첫 작업에서 확인) |
| RS-11 | Claude Code + Godot | GDScript 편집은 실용적이나 실행·런타임 오류 확인 불가 보고 | summerengine.com 블로그, 2026-09-17 | 제3자 블로그(공식 아님) |
| RS-12 | Ludo.ai | Indie $20(API 없음), Pro $50(API·MCP), 스프라이트 시트·투명 지원 | ludo.ai/pricing, 2026-09-17 | 상업 이용 조항 |
