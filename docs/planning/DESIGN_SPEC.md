# DESIGN_SPEC — SHORTHAND MVP

- project_id: shorthand · spec_version 1.0 · contract_version 1.0 · 기준일 2026-09-17
- 규격의 단일 원본은 `shared/asset_contract.json`, 색·타이포는 `shared/ui_tokens.json`. 이 문서는 방향·전수 목록·유형별 요구를 적고, 에셋별 지시는 `briefs/`에 있다.
- 디자인 스택(DC-04): HUD·아이콘·타일·몸체(파일럿) = vector_authored(코딩 에이전트가 SVG 작성) / 기준 그림·몸체(판정 후) = raster_generated(gpt-image-2.5) / 효과음 = audio_generated(ElevenLabs) / 글꼴 = library_sourced / VFX·HUD 렌더링 = code_rendered. 조사일 2026-09-17, 재확인 기간 3개월.
- 승인된 시각 기준: **없음.** 기준 그림(ref.shot.hud)은 디자인 세션의 파일럿 첫 작업이며 사용자가 승인한다(DC-05). 승인 전까지는 이 문서의 아트 바이블이 유일한 기준이다.

## 1. 전 범주 적용성 표

| 범주 | 적용 | 근거 | 실제 대상 | 수량 | 에셋 ID |
|---|---|---|---|---|---|
| 배경·공간 | required | 보드 바닥·벽 | 열린 뜰 타일 3종. 타이틀·결과 배경은 단색+토큰(code) | 3 | tile.floor, tile.floor_alt, tile.wall |
| 맵·지형·타일 | required | 11×11 격자 | 위와 동일. 랜드마크·높낮이 없음 | — | 동상 |
| 캐릭터 | required | 플레이어 1, 적 3, 보스 1 | 몸체만. 초상·표정·스킨 없음(N/A: 대사·선택 화면 없음) | 5 | visual.player.body, visual.enemy.{grunt,rapid,chaser}.body, visual.boss.executor.body |
| 장비·파츠 | N/A | 무기는 몸체에 포함, 탈착 없음 | — | — | — |
| 상호작용 오브젝트 | N/A | 문·상자 없음 | — | — | — |
| 아이템·재화 | required | 경험치 조각 | 필드 물체 1 | 1 | visual.shard |
| 투사체·전투 VFX | required | 공격·예고·막기·피격 | 전부 code_rendered (8절) | 11 binding | fx.* , board.danger_cell, board.spawn_marker |
| 비전투 VFX | required | 레벨업·사망·흡수 | code_rendered | 포함 위 | fx.levelup_beam, fx.death_dissolve, fx.pickup_line |
| 화면 UI | required | 8화면 | UI_UX_HANDOFF 1절 | 5 구성 이미지 | screen.layout.* |
| UI 부품 | required | 카드 패널, 버튼, 바 | 카드 패널만 파일, 나머지 code | 1 | ui.panel.card |
| 입력 피드백 | required | 명령창 상태, 포커스 | code_rendered 토큰 | — | hud.command_bar |
| 안내·실패·대기 | required | IME·포커스·저장 실패 | 텍스트 띠(code) | — | overlay.* |
| 텍스트·타이포 | required | 명령 mono, UI 한글 | 글꼴 2 | 2 | font.mono, font.ui |
| 애니메이션 | required(최소) | 대기 2프레임, 시전 포즈 1프레임, 나머지 코드 모션 | 몸체 5 × (idle 2 + cast/act 1) | 15 프레임 | clips |
| 음악·효과음 | required(효과음만) | 16 큐. 음악 N/A(MVP) | audio_generated | 16 | audio.* |
| 음성·자막 | N/A | 대사 없음 | — | — | — |
| 출시·마케팅 | N/A | MVP는 비공개 검증판 | — | — | — |
| 3D | N/A | 2D | — | — | — |
| 아이콘 | required | 적 4, 카드 계열 7, 상태 3, UI 3 | 묶음 1 | 17 | batch.icons.main |

여정 재검토(두 번째 도출): 타이틀 배경(단색 토큰, 코드), 카드 "응급 회복" 아이콘(icon.card.survival 재사용), 보스 등장 예고(board.spawn_marker 재사용, 크기 2배), 추적자 점선 연결(board.danger_cell tracking 상태). 누락 없음.

## 2. 아트·음향 바이블

| 구분 | 확정 값 |
|---|---|
| 세계관·감정 | 지워지는 기록의 도시. 긴박하지만 읽히는 화면. 유머 없음, 잔혹 표현 없음(피 없음, 사망은 잉크가 흩어지는 붕괴). 연령 인상 전체 이용가 |
| 형태·비례 | 잉크 실루엣. 캐릭터는 밝은 상아색 실루엣 + 어두운 내부 선 2~3개, 적은 어두운 몸체 + 주황 공격 부위. 머리:몸 = 1:2.5. 디테일 밀도 낮음(56px 표시에서 3요소 이하). 크기 등급: 일반 1칸, 보스 시각 1.4칸(점유 1칸) |
| 시점·공간 | 탑다운, 약한 정면성(몸체가 약간 앞을 향함). 방향 표현 없음(무기 호는 코드가 8방향으로 그림). 반전 없음 |
| 색·빛·재질 | ui_tokens.colors. 바탕 먹색, 플레이어 상아색, 위협 주황, 아군 효과 청록, 경험치 연청, 보스 금색 포인트. 광원 없음(평면), 외곽선 2px 어두운색, 그림자는 코드 타원 |
| UI·문자 | 명령·숫자는 mono 28/16px, 본문 Pretendard 18px. 패널은 먹색 위 청회색 테두리 1px. 텍스트를 이미지에 굽지 않는다 |
| 모션 | 몸체는 거의 정지(대기 2프레임 호흡 0.9초 주기). 공격은 코드 모션 120ms 돌출. 피격 60~100ms 밝기 변화. 카메라 흔들림 없음 |
| VFX | 의미별 색 고정: 내 공격 청록, 적 예고·공격 주황, 막기 청록 반원, 경험치 연청 선, 레벨업 상아색 광선. 판정 칸과 효과 범위 일치. 동시 최대 12개 효과. 약한 효과 모드에서 파편·잔상 제거 |
| 음악·음색 | 음악 없음(MVP). 효과음은 마른 금속·종이·잉크 질감. 입력음은 작고 짧게(끌 수 있음). 경고음은 여러 적이 반복하지 않게 큐당 1회 |
| 품질·공정 | 원본 SVG(vector) / PNG(raster) / WAV(audio). 런타임 PNG 2배 캔버스, OGG. 검수는 규격 스크립트 + 실제 크기 프리뷰 |
| 디자인 스택 | DC-04. 제약→규칙 표는 `STACK_DECISION.md` 3절 |
| 기준 자료 | GAME_CONCEPT_0 9절, v1.3 2부의 색·실루엣 제안(글로만 존재). ref.shot.hud는 파일럿 후 승인 시 참조 채택 |

**공통 스타일 문단 (시각, 생성 서비스용 — 글자 하나 바꾸지 않고 복사)**

> 위에서 내려다본 2D 게임 스프라이트. 손으로 그린 잉크 실루엣 스타일, 평면 채색, 광원과 그림자 없음, 두꺼운 어두운 외곽선, 질감 없음. 배경색은 진한 먹색 #151A21. 밝은 대상은 상아색 #F2E9D8, 위협 요소는 주황색 #FF9B54, 이 두 색 외에는 어두운 청회색 계열만 사용. 세부 장식은 최소한으로, 작은 크기에서도 실루엣만으로 구분되게. 글자, 숫자, 로고, 워터마크, 배경 그림 없음.

**공통 스타일 문단 (음향, 생성 서비스용)**

> 짧고 마른 게임 효과음. 잉크와 종이, 얇은 금속의 질감. 잔향 거의 없음, 저음 울림 없음, 배경 소음 없음. 단일 이벤트 한 번.

## 3. 전수 목록·관계·수량

에셋 원본표는 `shared/asset_contract.json`의 assets·code_rendered·audio_cues가 원본이다. 여기서는 집계와 커버리지만 적는다.

| 집계 | 수 |
|---|---|
| entity | 5 (player, grunt, rapid, chaser, boss) |
| asset(파일 있는 것) | 몸체 5, 조각 1, 타일 3, 카드 패널 1, 아이콘 묶음 1(17), 글꼴 2, 화면 구성 5, 기준 그림 1 = 19 항목 |
| clip | 몸체 5 × 2 = 10 (idle, cast/act) |
| frame | idle 2 × 5 + cast 1 × 5 = 15 |
| part | player 3 (shadow, body, guard_arc) |
| code_rendered binding | 19 |
| cue | 16 |
| job | briefs/ 참조 (파일럿 11, 나머지 14) |

| 기능·콘텐츠 | 화면·상태 | 요구 | 표현 ID | 수량 | 생성 목록 수 | 비고 |
|---|---|---|---|---|---|---|
| 플레이어 | run.hud | 몸체·막기 호·그림자 | visual.player.body, fx.guard_arc, board.unit_shadow | 1 asset + 2 code | 1 | act 프레임은 공격 순간 포즈 |
| 잔병·속사병·추적자 | run.hud | 몸체 대기·시전 포즈, 아이콘 | visual.enemy.*.body, icon.enemy.* | 3 + 3 | 6 | — |
| 보스 | run.hud | 몸체, 아이콘, 직선 예고 | visual.boss.executor.body, icon.enemy.boss, fx.boss_line | 1 + 1 + code | 2 | — |
| 조각 | run.hud | 필드 물체, 흡수 선 | visual.shard, fx.pickup_line | 1 + code | 1 | — |
| 바닥·벽 | run.hud | 타일 | tile.* | 3 | 3 | batch |
| 링·게이지·명령창·사이드 | run.hud | code | hud.*, ring.* | code | — | 8절·UI_UX 3절 |
| 레벨업 | levelup | 카드 패널, 계열 아이콘 | ui.panel.card, icon.card.* | 1 + 7 | 8 | — |
| 화면 5종 | title, pause/settings, levelup, result/records, hud | 구성 이미지 | screen.layout.* | 5 | 5 | 검토 자료 |
| 오디오 | 전 화면 | 16 큐 | audio.* | 16 | 16 | — |

## 4. 배경·타일 (batch.tiles.yard)

- 사용 장면: run.hud 보드. 카메라 고정. 타일 표시 56px, 원본 112px.
- 레이어: 바닥 1층(z 0), 벽 1층(z 1, 외곽 40칸), 그 위에 코드 렌더링 위험 칸·조각·유닛.
- 반복: 바닥 타일은 상하좌우 이음새가 보이지 않아야 한다(경계 4px는 균일한 먹색). floor_alt는 20% 칸에 난수 배치되므로 floor와 경계가 같아야 한다.
- 조명·날씨 변형 없음. 정보 밀도: 바닥 무늬 대비는 bg.ink 대비 1.3:1 이하(위험 칸·조각보다 항상 낮게).
- 벽: 외곽 1칸. 바닥보다 밝은 청회색 면 + 안쪽 모서리에 2px 어두운 선. 코너 전용 타일 없음(같은 타일 반복 허용).
- 검수: 11×11 합성 미리보기에서 이음새 없음, 위험 칸 빗금이 바닥 무늬와 혼동되지 않음.

## 5. 캐릭터·적·보스

| entity | 역할·성격 | 실루엣 규칙 | 주요 색 | 식별 특징 | 금지 변화 | states | clips |
|---|---|---|---|---|---|---|---|
| player | 곧게 선 전투자 | 세로로 약간 긴 상아색 실루엣, 한쪽 어깨 천, 옆으로 나온 칼집 | player.ivory + 내부 선 bg.slate | 밝은 유일한 실루엣 | 색을 어둡게, 무기를 크게(호가 코드로 그려짐) | idle, act | idle(2f), act(1f: 상체가 앞으로 기운 포즈) |
| grunt 잔병 | 얼굴 없는 갑옷 보초 | 사각에 가까운 몸통, 짧은 한손 칼 | bg.slate 몸체, 칼끝 threat.orange | 가장 단순한 사각 실루엣 | 밝은 색, 긴 무기 | idle, cast | idle(2f), cast(1f: 칼을 어깨 위로 올림) |
| rapid 속사병 | 가늘고 빠른 바늘 서기 | 가는 다리, 새부리 가면, 바늘 무기 | bg.slate, 바늘 끝 orange | 세로로 가늘고 뾰족 | 굵은 몸통 | idle, cast | idle(2f), cast(1f: 몸을 낮춤) |
| chaser 추적자 | 뒤따르는 문장 | 길게 찢어진 망토, 작은 머리, 마름모 실루엣 | bg.slate, 망토 끝 orange | 마름모 실루엣, 망토 흔들림(프레임 2) | 사각 실루엣 | idle, cast | idle(2f), cast(1f: 앞으로 쏠림) |
| boss 집행자 | 기록 관리자의 잔해 | 큰 검과 원형 인장판, 육각 실루엣 | bg.slate + boss.gold 인장 | 유일한 금색, 1.4배 크기 | 1칸 점유 표시와 다른 발 위치 | idle, cast | idle(2f), cast(1f: 검을 수평으로 든 포즈) |

몸체·초상·장비 중 몸체만 필요. 사망·피격은 코드 모션(8절). 방향 없음. 그림자는 코드. 검수: 56px 표시에서 4종 실루엣이 이름 없이 구분됨(T-UI-09 대응 디자인 검사), 피벗(발) 정확, idle 2프레임 사이 크기 흔들림 없음(외곽 차이 2px 이내).

## 6. 오브젝트·아이템

visual.shard: 작은 마름모, xp.blue 채움 + 밝은 심. 표시 24px(원본 112 캔버스 중앙 48px). 수량 텍스트는 코드가 옆에 렌더(2 이상일 때). 검수: 바닥 무늬·위험 빗금 위에서 식별, 밝기 발광 없음(낮은 우선순위 유지).

## 7. UI

### 7.1 화면 구성 이미지
UI_UX_HANDOFF 2절의 layout_id별 1장(L-HUD는 파일럿에서 ref.shot.hud). 실제 카피(strings.json)·대표 데이터 사용. 편집 원본 SVG.

### 7.2 링·게이지 (code_rendered, 개발 구현 목표)
- 플레이어 셀 중심 반지름 88px 원 위에 8구간(위부터 시계방향), 구간 사이 6도 간격.
- 각 구간: 바탕 호(line.faint, 폭 8px). 시전 중이면 threat.orange 호가 0→1로 시계방향 채움(남은 비율 = 1 − remaining/cast). 남은 1.0초 이하: 호 색 warn.red, 두께 10px.
- 구간 바깥 108px에 남은 초 텍스트(mono 16px, 소수 1자리, 1.0 이하 굵게). 128px에 적 아이콘 20px. 같은 방향 2번째 시전은 아이콘 오른쪽 위 작은 눈금.
- 축약된 방향 구간은 바탕 호 색 line.strong(밝음). 상한 대기 적은 icon.status.wait를 몸체 위에.
- 약한 효과 모드에서도 링은 그대로.

### 7.3 명령창
616×36 패널, 왼쪽 24px 여백에 버퍼(mono 28px, 상아색), 오른쪽에 "남은 글자 N" 또는 후보 3개(muted). 상태별 테두리는 ui_tokens.component_states.

### 7.4 사이드 패널
4행. 1행: 시계 mm:ss(mono 28) · HP 칸 · XP 바. 2행: 축약표(동작 5행 + 방향 4행, 현재 최단 토큰, 바뀐 행 청록 0.6초). 3행: 회전베기 쿨다운. 4행: 힌트(muted) / 피격 원인(orange).

### 7.5 토큰
버튼·패널·행은 ui_tokens.component_states. 9-slice는 ui.panel.card만.

### 7.6 카피·글꼴
strings.json / font.mono(JetBrains Mono), font.ui(Pretendard). 대체 글꼴: 시스템 monospace, sans-serif(폭 차이를 검사 대상으로 기록).

## 8. VFX (전부 code_rendered · 개발 구현 계약)

| effect_id | 의미 | 트리거 | 공간 | 형태·궤적 | 단계·길이 | 색·블렌드 | 상한·대체 |
|---|---|---|---|---|---|---|---|
| fx.slash | 베기 판정 | ev.hit(slash)·ev.miss(slash) | 대상 칸 | 셀을 가로지르는 초승달 호(폭 6px), 명중 시 흰 선 2개 | 0→120ms 등장, 200ms 잔상 | ally.teal, normal | 약한 효과: 잔상 없음 |
| fx.thrust | 찌르기 | ev.hit(thrust) | 플레이어→대상 | 가는 선(3px) + 대상 칸 다이아 | 100ms + 150ms | ally.teal | — |
| fx.spin | 회전베기 | act.spin | 3칸 | 넓은 부채꼴 호 | 150ms + 200ms | ally.teal | 360도 원 금지 |
| fx.guard_arc | 막기 | ev.guard_set / consumed / 만료 | 플레이어 주변 반지름 34px | 반원 호(폭 5px), 소모 시 파편 6개 바깥으로 | 지속 동안 유지, 소모 200ms, 만료 시 100ms 페이드 | ally.teal | 약한 효과: 파편 없음 |
| fx.move_trail | 이동 | ev.move | 원래 칸 | 몸체 실루엣 잔상 1개 | 150ms 페이드 | player.ivory 0.4 | — |
| board.danger_cell | 예고 | ev.cast_started | 예고 칸 | 빗금(45도, 4px 간격) + 테두리 2px. tracking은 점선 테두리, locked·fixed는 실선 | 시전 동안. 남은 1초 이하 테두리 warn.red | threat.orange | 유지(접근성 필수) |
| fx.enemy_attack | 적 공격 판정 | R-ATTACK | 예고 칸 | 칸 전체 주황 섬광 + 방향 사선 | 80ms + 120ms | threat.orange | 약한 효과: 섬광 밝기 절반 |
| fx.player_hit | 피격 | ev.player_hit | 플레이어 | 몸체 밝기 +60% 80ms, 붉은 테두리 | 200ms | warn.red | 화면 점멸 금지 |
| fx.pickup_line | 흡수 | ev.shard_picked | 조각→플레이어 | 가는 선 + 조각 이동 | 200ms | xp.blue | — |
| fx.levelup_beam | 레벨업 | ev.levelup | 플레이어 | 수직 광선 폭 24px | 400ms | player.ivory | — |
| fx.death_dissolve | 적 사망 | ev.kill | 대상 칸 | 몸체 알파 1→0 + 잉크 파편 8개 | 350ms | bg.slate/orange | 약한 효과: 파편 4개 |
| fx.boss_line | 보스 예고 | ev.boss_telegraph | 직선 3칸 | 3칸 빗금 + 순서 숫자 1·2 | 시전 동안 | threat.orange + boss.gold 테두리 | — |
| board.spawn_marker | 등장 예고 | ev.spawn_telegraph | 등장 칸 | 점선 사각이 1.0초 동안 56→40px로 축소 | 1.0초 | threat.orange_dim | — |
| board.unit_shadow | 그림자 | 항상 | 유닛 발밑 | 타원 40×14 | — | 검정 0.35 | — |

판정과 효과의 관계: 판정은 시뮬레이션 스텝, 효과는 렌더 프레임. 효과가 늦거나 빠져도 판정을 바꾸지 않는다. 대상 사망·일시정지 시 효과는 즉시 정지(페이드 없이 제거).

## 9. 애니메이션

| clip_id | 상태 | frame_count | duration_ms | 루프 | 포즈 |
|---|---|---|---|---|---|
| visual.*.body.idle | 대기·접근·회복 | 2 | 450, 450 | 예 | f0001 기준 포즈, f0002 몸체 1~2px 위로 든 호흡 포즈(실루엣 외곽 차이 2px 이내) |
| visual.player.body.act | 공격 완성 순간 | 1 | 0(코드가 120ms 표시 후 idle 복귀) | 아니오 | 상체 앞으로 기움, 칼집 뒤로 |
| visual.enemy.*.body.cast | 시전 중 | 1 | 0(시전 동안 유지) | 아니오 | 5절 표의 포즈 |
| visual.boss.executor.body.cast | 시전 중 | 1 | 0 | 아니오 | 검 수평 |

리깅·시트 없음. 프레임은 개별 PNG(f0001, f0002). 코드 모션 트랙: 공격 돌출(위치 +6px 방향, 120ms, ease-out), 피격(밝기), 사망(알파), 이동(위치 보간 80ms 선형 — 판정은 즉시, 그림만 보간).

## 10. 오디오

큐 표는 asset_contract.audio_cues. 음색 참조: 베기 = 마른 금속 마찰 후 짧은 절단, 찌르기 = 얇은 바람 + 단단한 점 타격, 막기 = 종이가 접히는 둔탁한 막힘, 경고 = 낮은 유리 두드림 1회, 피격 = 잉크가 튀는 둔탁음, 사망 = 종이가 찢어지며 흩어짐, 조각 = 작은 유리 알갱이, 레벨업 = 낮은 종 + 상승 잔향 1초, 입력음 = 연필이 종이를 스치는 톡. 검수: 길이·피크·앞 무음 0ms, 4개 동시 재생에서 뭉개지지 않음, 청각 확인 기록.

## 11. 3D / 12. 출시 소재
N/A (2D, MVP 비공개).

## 13. 브리프 생산과 완료 점검
- 파일럿 브리프: `briefs/pilot/` 11개(ref.shot.hud, player.body, grunt.body, batch.tiles.yard, shard, batch.icons.main, ui.panel.card, font.mono, font.ui, audio.type_key, audio.hit_slash, audio.cast_warning → 파일 12개, 묶음 포함).
- 나머지 브리프: `briefs/phase3/` (rapid, chaser, boss 몸체 / 화면 구성 5 / 오디오 13 묶음 브리프). 파일럿 판정 후 지시문·스타일 문단이 바뀌면 3단계 인계에서 갱신본을 보낸다.
- 완료 점검: 적용성 표 → 커버리지 → asset_contract → briefs의 ID 일치를 `FINAL_REVIEW_RESULT.md`에 기록.
