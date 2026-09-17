# UI_UX_HANDOFF — SHORTHAND MVP

- project_id: shorthand · spec_version 1.0 · contract_version 1.0
- 단일 원본: 좌표·색·타이포는 `shared/ui_tokens.json`, 카피는 `shared/strings.json`. 이 문서는 화면·상태·행동과 담당 작업을 연결한다.
- 지원 화면: 1280×720 기준 16:9. 창 크기가 다르면 비율 유지 스케일과 레터박스. 세로 모드·다국어 없음(MVP).

## 1. 사용자 여정과 화면표

| screen_id | 여정 | 종류 | 진입 | 표시 데이터 | 행동 | 목적지 | 필요 상태 | layout_id | 디자인 job | 개발 job | test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| screen.title | 실행 | 전체 | 앱 시작, 결과에서 복귀 | 게임명, 한 줄 설정, 메뉴 4, 버전 | 위/아래·Enter, 클릭 | run, settings, records, quit | 기본 / 저장 손상 안내(error.save) | L-TITLE | design.screen_title | dev.screens | T-UI-03 |
| screen.run.hud | 플레이 | 전체+HUD | 시작 | 보드·링·명령창·사이드(시계·HP·XP·축약표·스킬·힌트·피격 원인) | 문자 입력, Backspace, Esc, F10 | levelup, pause, result | waiting_first_input / combat / ime_notice / focus_lost | L-HUD | design.screen_hud(파일럿은 ref.shot.hud) | dev.hud_* | T-UI-01·02 |
| screen.levelup | 플레이 | 모달(세계 정지) | 레벨업 대기열 | 카드 3장(또는 응급 1장), 푸터 | 1/2/3 강조, Enter·클릭 확정 | run.hud 또는 다음 카드 | 3장 / 1장 응급 | L-LEVELUP | design.screen_levelup, design.ui_cards | dev.levelup_screen | T-OFFER-01, T-UI-04 |
| screen.pause | 플레이 | 모달(정지) | F10, 빈 버퍼 Esc, 포커스 상실 후 복귀 | 메뉴 4 | 위/아래·Enter | 계속, settings, 재시작(확인), 타이틀(확인) | 기본 / 확인 대화 | L-PAUSE | design.screen_pause_settings | dev.screens | T-UI-03 |
| screen.settings | 진입·플레이 | 모달 | 타이틀·일시정지 | 5개 설정 항목 | 좌우로 값 변경, Enter 토글, 뒤로 | 호출한 화면 | 기본 | L-SETTINGS | 동상 | dev.settings | T-UI-05 |
| screen.result | 종료 | 전체 | 사망·클리어 | 결과·통계·선택 순서·피격 목록·마지막 10초 기록 | 재도전(같은/새 시드), 타이틀 | run, title | clear / death | L-RESULT | design.screen_result | dev.result | T-UI-06 |
| screen.records | 진입 | 전체 | 타이틀 | 최근 50 기록 목록 | 위/아래 스크롤, 뒤로 | title | 목록 / 빈 목록(records.empty) | L-RECORDS | design.screen_result(같은 군, 차이표) | dev.records | T-UI-07 |
| overlay.ime_notice | 플레이 | 오버레이(정지) | IME 조합 감지 | hud.ime_notice | 영문 전환 시 자동 해제 | run.hud | — | L-HUD 내 띠 | — (코드 렌더링) | dev.input_layer | T-INPUT-01 |
| overlay.focus_lost | 플레이 | 오버레이(정지) | 창 포커스 상실 | hud.focus_lost | 클릭·키 입력으로 해제(그 키는 버퍼에 넣지 않음) | run.hud | — | L-HUD 내 띠 | — | dev.input_layer | T-INPUT-02 |

N/A: 로딩(에셋이 작아 즉시), 계정·상점·온라인, 연결 오류. 설정 값은 로컬 저장, 변경 즉시 적용, 재진입 시 유지(T-UI-05).

**설정 항목**

| 항목 | 범위 | 기본값 | 적용 시점 | 저장 |
|---|---|---|---|---|
| 전체 음량 | 0~100 (10 단위) | 80 | 즉시 | 예 |
| 입력음 | 켬/끔 | 켬 | 즉시 | 예 |
| 약한 효과 | 켬/끔 (파편·잔상·광택 축소, 위험 칸·게이지 유지) | 끔 | 즉시 | 예 |
| 힌트 표시 | 켬/끔 | 켬 | 다음 런 | 예 |
| 전체 화면 | 켬/끔 | 끔 | 즉시 | 예 |

## 2. 레이아웃과 시각 목표

| layout_id | 화면·상태 | 구역 (ui_tokens.layout_1280x720) | 정보 우선순위 | 대표 데이터·긴 문자열 | 합격 기준 |
|---|---|---|---|---|---|
| L-HUD | run.hud 전 상태 | board, ring, command_bar, side_panel 4행, top_strip | 명령창·링 게이지 → 위험 칸 → 몸체 → 막기 호 → 잔상 → 조각 → 바닥 | 버퍼 24자, 축약표 8행, 피격 원인 2줄 | 동시 시전 4개 상태 캡처에서 남은 초 순서를 5초 안에 읽음(T-UI-01) |
| L-LEVELUP | levelup 3장 / 응급 1장 | dim 오버레이, 카드 3 (240×320), 푸터 | 카드 제목·전후 값 → 계열 아이콘 → 푸터 | 카드 본문 3줄, 명령 예시 `slash downright.` 16자 | 선택 카드가 색과 테두리 굵기 둘 다로 구분 |
| L-TITLE | title | 중앙 정렬 메뉴, 하단 버전 | 시작 버튼 | — | 포커스 항목이 키보드만으로 식별 |
| L-PAUSE / L-SETTINGS | pause, settings | 중앙 패널 480×400 | 현재 값 | 설정 5행 | 값 변경이 즉시 반영, 뒤로 시 포커스 복귀 |
| L-RESULT / L-RECORDS | result, records | 좌: 요약, 우: 로그 목록(스크롤) | 결과·시간 | 피격 목록 20행, 마지막 10초 40행 | 스크롤 없이 요약이 보이고 로그는 스크롤 |

디자인 트랙은 각 고유 레이아웃의 완성 화면 구성 이미지와 편집 원본(screen.layout.*)을 납품한다. 파일럿에서는 L-HUD만 ref.shot.hud로 대신한다. 이 구성 이미지는 검토 자료이며 런타임 UI를 이미지로 굽지 않는다.

## 3. 컴포넌트·상태·출력 계약

| component_id | 사용처 | 상태 | 시각 차이 | 표현 방식 | 출력·교체 단위 | 담당·검사 |
|---|---|---|---|---|---|---|
| ui.button | 타이틀·일시정지·설정·결과 | normal, hover, pressed, disabled, focus | ui_tokens.component_states | code_rendered(토큰) | 토큰 | dev / T-UI-03 |
| ui.panel.card | levelup | normal, selected | 테두리색·글로우 | vector_authored PNG 9-slice(inset 24) | asset | design / T-UI-04 |
| hud.command_bar | run.hud | idle, valid_prefix, invalid(0.2초), complete_flash(0.12초) | 테두리색 | code_rendered | 토큰 | dev / T-PARSE-* |
| hud.ring | run.hud | 구간별 idle / casting(게이지 0~1) / warning(≤1.0초) / waiting(상한 대기) / abbreviated(테두리) | 호 채움, 숫자, 아이콘, 테두리 | code_rendered | 토큰 | dev / T-UI-01 |
| ring.gauge | hud.ring 안 | 값 0~1 | 호 길이(시계방향 채움), 남은 초 소수 1자리 | code_rendered | — | dev |
| hud.side.abbr_table | run.hud | 8행(동작 5 + 방향 4묶음) 갱신 강조 0.6초 | 토큰 텍스트, 방금 바뀐 행 청록 | code_rendered | — | dev / T-UI-08 |
| hud.xp_bar | run.hud | 값 0~1, 레벨업 순간 채움 애니 0.3초 | 바탕/채움 파츠 | code_rendered | — | dev |
| hud.hp | run.hud | 1~8 칸 | 채운 칸/빈 칸 | code_rendered | — | dev |
| hud.hint | run.hud | 표시/숨김 | 텍스트 띠 | code_rendered | — | dev |
| hud.hit_reason | run.hud | 표시 3초 후 숨김, 새 원인이 덮어씀 | 주황 텍스트 | code_rendered | — | dev / T-UI-02 |
| board.danger_cell | run.hud | fixed / tracking(점선) / locked(실선) / boss_line | 주황 빗금 + 테두리 | code_rendered | — | dev / T-CHASER-01 |
| board.spawn_marker | run.hud | 1.0초 카운트 | 주황 점선 사각 축소 | code_rendered | — | dev |
| icon.* | ring, card, side, screens | 단일 | — | vector_authored PNG | batch | design / T-UI-09 |
| settings.row | settings | normal, focus, value_changed | 값 텍스트 좌우 화살표 | code_rendered | 토큰 | dev / T-UI-05 |
| list.row | records, result 로그 | normal, focus | — | code_rendered | 토큰 | dev / T-UI-07 |

가변 컴포넌트: ring.gauge(호 길이), hud.xp_bar(바탕·채움), hud.hp(칸 수), settings.row 음량(0~100). 값→시각 변환은 위 표와 ui_tokens. 9-slice는 ui.panel.card에만 적용한다.

## 4. 행동·입력·접근성

| action_id | 화면·상태 | 입력 | 처리 | 기대 변경 | 피드백 | 실패·중복 | 취소 | 테스트 |
|---|---|---|---|---|---|---|---|---|
| ui.title.navigate | title | 위/아래, Enter, 클릭 | 포커스 이동·확정 | 목적지 화면 | 포커스 테두리 | — | — | T-UI-03 |
| ui.run.type | run.hud combat | 문자 | GAME_SPEC 2.3 | 버퍼 | command_bar 상태, cue | 허용 외 무시 | Esc | T-PARSE-* |
| ui.run.pause | run.hud | F10, 빈 버퍼 Esc | phase=paused | 세계 정지 | pause 모달 | 레벨업 중 무시 | 계속 | T-UI-03 |
| ui.levelup.select | levelup | 1/2/3, Enter, 클릭 | 강조 → 확정 | 카드 적용 | 카드 selected, 축약표 강조, cue | 확정 전 다른 번호로 변경 가능. Enter 연타 중복 방지(확정 후 0.3초 입력 무시) | 없음(선택 필수) | T-UI-04 |
| ui.settings.change | settings | 좌/우, Enter | 값 변경·토글 | 즉시 적용·저장 | 값 갱신 | 저장 실패 시 error.save 표시 후 진행 | 뒤로 | T-UI-05 |
| ui.result.retry | result | 1(같은 시드)/2(새 시드)/Enter, 클릭 | 새 런 | run.hud | — | — | 타이틀 | T-UI-06 |
| ui.pause.restart / to_title | pause | Enter | 확인 대화("진행 중인 런이 사라집니다") | 새 런 / 타이틀 | — | — | 아니오 | T-UI-03 |

모달 규칙: 최초 포커스는 첫 항목(레벨업은 카드 1), 내부 탐색은 키보드, 배경 입력 차단, 닫기 시 호출 화면의 이전 포커스 복귀. 모든 모달은 게임 시계를 멈춘다.

접근성 목표: 색만으로 상태를 구분하지 않는다(모양·굵기·텍스트 병행). 게이지 숫자 대비 7:1. 약한 효과 모드에서 위험 칸·게이지·피격 여부 유지, 화면 전체 점멸 없음. 입력음은 끌 수 있다. 키보드만으로 모든 화면 조작 가능.

## 5. 트랙별 반환물

| 담당 | 반환물 | 수락 증거 |
|---|---|---|
| 디자인 | screen.layout.* 5종(파일럿은 ref.shot.hud), ui.panel.card 2상태, batch.icons.main, 폰트 라이선스 | 화면군·상태 검토 이미지, 원본/납품 대응, 고유 검수 기준 결과 |
| 개발 | 실제 데이터·행동이 있는 8화면, 기본 에셋과 리졸버, 설정 저장·복원 | 화면별 핵심 행동 캡처, T-UI-* 결과 |
| 통합 | 최종 파일·토큰 적용과 소비 위치 확인 | 교체 확인 캡처, 미연결 슬롯 보고 |

## 6. 완료 오판을 막는 검수

화면 ID 노출·라우트 진입만으로 완료하지 않는다. 필수 행동: 설정값 변경→재진입 유지(T-UI-05), 레벨업 카드 확정→축약표 갱신→다음 명령이 새 토큰으로 실행(T-UI-08), 결과 화면의 피격 목록이 실제 ev.player_hit와 일치(T-UI-06), 기록 화면 빈 목록 문구(T-UI-07). 시각 증거와 동작 증거를 함께 남긴다.
