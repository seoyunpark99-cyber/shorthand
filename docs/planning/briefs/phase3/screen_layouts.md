# 브리프: 화면 구성 이미지 5종 — screen.layout.{title, hud, levelup, pause_settings, result}

파일럿 판정 후 제작. 검토 자료이며 런타임 UI를 이미지로 굽지 않는다. 편집 원본(SVG)과 PNG 1280×720을 납품한다.

## 공통
- project_id: shorthand · contract_version 1.0 · production_method: vector_authored · 교체 단위: N/A(검토 자료)
- 좌표·구역: `shared/ui_tokens.json` layout_1280x720. 색·타이포: 같은 파일. 카피: `shared/strings.json`의 실제 문구. 아이콘: batch.icons.main 결과 사용. 글꼴: font.mono, font.ui.
- 고유 검수 기준(공통): (1) 모든 텍스트가 strings.json의 실제 카피다(더미 "Lorem" 금지). (2) 구역 좌표가 ui_tokens와 4px 이내로 일치한다.

## screen.layout.title (job.p3.layout_title)
- 내용: 중앙 SHORTHAND(40px), 아래 tagline(18px muted), 메뉴 4(시작·설정·기록·종료, 버튼 160×44, 첫 항목 focus 상태), 하단 오른쪽 "MVP 1.0". 바탕 bg.ink 단색.
- 고유 검수: focus 항목이 테두리 청록 2px로 보인다.

## screen.layout.hud (job.p3.layout_hud)
- 내용: 대표 데이터 — 시계 02:41, HP 3/5, LV 4 · 2/6, 축약표(베기 s / 찌르기 thrust / 막기 gu / 이동 m / 회전베기 — / 가로 4·6 / 세로 up.·down. / 대각 upleft.· … ), 회전베기 "준비", 피격 원인 "아래 잔병, 명령 미완성(5/7자)", 명령창 버퍼 "s 4" + 남은 글자 0 표시 직전 상태. 보드: 플레이어 (5,5), 잔병 (4,5) 시전 게이지 1.8초, 속사병 (6,4) 시전 0.9초(warn), 추적자 (5,7) 점선, 조각 2개.
- 고유 검수: 링 4구간 이상이 동시에 다른 상태(idle/casting/warning/abbreviated)로 보인다.

## screen.layout.levelup (job.p3.layout_levelup)
- 내용: dim 오버레이 위 카드 3장 (240×320): 카드1 selected "베기 축약 II" `sl left.` 8자 → `s left.` 7자, 카드2 "가로 축약", 카드3 "날 세우기" 베기 피해 2 → 3. 각 카드 좌상단 계열 아이콘 32px, 우상단 랭크 "2/2". 푸터: HP 3/5 · 주력 sl 4 · 다음 적: 잔병, 속사병.
- 고유 검수: 선택 카드가 색과 두께 둘 다로 구분.

## screen.layout.pause_settings (job.p3.layout_pause)
- 내용: 왼쪽 절반에 일시정지 패널(계속·설정·처음부터·타이틀로), 오른쪽 절반에 설정 패널(5행, 값 표시, 2행 focus). 뒤 HUD는 dim.
- 고유 검수: focus 행의 값이 좌우 화살표로 변경 가능함이 보인다.

## screen.layout.result (job.p3.layout_result)
- 내용: 좌: "클리어 / 생존 04:58 / 레벨 8 / 처치 41 / 선택 순서: A01, A03, A06, A01, A05, A02, A08" · 우: 받은 피해 5행, 마지막 10초 로그 12행(mono 16px, 스크롤 힌트). 하단 버튼 3(같은 시드로 다시 / 새 시드로 다시 / 타이틀로). records 화면은 이 구성의 차이표(좌 요약 대신 목록 20행, 빈 목록 상태 1장 추가)로 대신한다 → 총 PNG 2장(result, records_empty).
- 고유 검수: 요약이 스크롤 없이 보이고 로그 영역만 스크롤임이 표시된다.

## 규격 맞추는 지시 (공통)
> job.p3.layout_*. 각 화면을 SVG 원본과 PNG 1280×720으로 출력한다. 좌표는 ui_tokens.layout_1280x720을 따르고 편차를 manifest에 기록한다. 사용한 문자열 키 목록을 함께 기록한다(코드가 같은 키를 쓰는지 개발이 대조). 고유 검수 결과 기록.
