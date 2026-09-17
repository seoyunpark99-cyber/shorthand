# 브리프: ui.panel.card — 증강 카드 패널 (파일럿, 벡터, 9-slice)

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · contract_hash: shared/CONTRACT_HASH.txt
- job_id: job.pilot.card_panel · asset_id: ui.panel.card · states: normal, selected
- 사용: screen.levelup 카드 3장(240×320). 텍스트·아이콘은 코드가 위에 렌더(이미지에 글자 없음)
- 만드는 파일: SVG 1 → PNG 2(상태별) · 교체 단위: asset

## 제작 방식
- production_method: vector_authored · 이유: 정확한 9-slice 영역 필요 · 원본 SVG

## 디자인 요구
- 먹색 패널 #1C232C, 모서리 반지름 12, 테두리 2px. normal 테두리 #8A96A6, selected 테두리 #60DBCE 3px + 바깥 6px 청록 글로우(불투명도 0.35). 상단 56px 띠는 #303A46(제목 영역), 좌상단 40×40 아이콘 자리는 코드가 그림.
- 고유 검수 기준: (1) 9-slice로 240×320과 200×280으로 늘려도 모서리가 찌그러지지 않는다. (2) selected는 색을 못 보는 사람에게도 테두리 두께로 구분된다.

## 공통 계약 규격
- 캔버스 240×320 원본 그대로 납품(2배 없음: UI는 1배). 9-slice inset 24px(네 변). 내용 inset 16px. RGBA straight alpha PNG.
- 파일: ui.panel.card/normal.png, selected.png, source.svg

## 만드는 지시
> 240×320 캔버스. 바탕 둥근 직사각형 x 2..238, y 2..318, 반지름 12, 채움 #1C232C, 외곽선 #8A96A6 2px. 상단 띠: 둥근 직사각형 위쪽 절반만 x 2..238, y 2..58, 채움 #303A46(아래 모서리는 각지게). selected 변형: 외곽선 #60DBCE 3px, 그 바깥에 같은 모양의 6px 선 #60DBCE 불투명도 0.35. 넣지 말 것: 글자, 아이콘, 그림자.

## 규격 맞추는 지시
> job.pilot.card_panel. normal.png, selected.png 240×320 출력. 9-slice inset 24px를 manifest에 기록하고 200×280, 240×320, 280×360 세 크기로 늘린 프리뷰를 만든다. 고유 검수 (1)(2) 결과 기록.
