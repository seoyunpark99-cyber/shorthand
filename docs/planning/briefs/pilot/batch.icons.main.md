# 브리프: batch.icons.main — 아이콘 17종 묶음 (파일럿, 벡터)

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · contract_hash: shared/CONTRACT_HASH.txt
- job_id: job.pilot.icons · batch_id: batch.icons.main
- 포함 asset_id (시트 순서, 6열×3행 왼쪽 위부터 행 우선):
  1 icon.enemy.grunt · 2 icon.enemy.rapid · 3 icon.enemy.chaser · 4 icon.enemy.boss · 5 icon.card.abbr_action · 6 icon.card.abbr_direction
  7 icon.card.abbr_grammar · 8 icon.card.offense · 9 icon.card.survival · 10 icon.card.skill · 11 icon.card.utility · 12 icon.status.guard
  13 icon.status.cooldown · 14 icon.status.wait · 15 icon.ui.pause · 16 icon.ui.settings · 17 icon.ui.close · 18 (빈 칸)
- 사용: 링(적 아이콘 20px), 카드(계열 32px), 몸체 위 상태(20px), 상단 띠·모달(20~32px)
- 만드는 파일: SVG 시트 1 → PNG 17 · 교체 단위: batch

## 제작 방식
- production_method: vector_authored · 이유: 같은 선 규칙의 세트, 정확한 크기 필요 · 원본 SVG

## 디자인 요구
- 단색 선 아이콘, 선 굵기 5px(64 캔버스 기준), 둥근 선 끝, 채움 없음(적 아이콘만 실루엣 채움). 색은 #F2E9D8 단일(코드가 상황에 따라 색을 바꿀 수 있게 흰색 계열 1색). 20px 축소에서 형태가 유지되어야 하므로 요소 3개 이하.
- 각 아이콘 의미:
  grunt 사각 실루엣+작은 칼 / rapid 가는 세로 실루엣+바늘 / chaser 마름모 실루엣+망토 꼬리 / boss 육각 실루엣+원형 인장 /
  abbr_action 긴 획이 짧은 획으로(긴 가로선 위, 짧은 가로선 아래) / abbr_direction 네 방향 화살표가 숫자 모양 하나로(화살 십자와 작은 사각) / abbr_grammar 두 획 사이 간격이 붙는 모양(두 세로선과 사이 점) /
  offense 칼날 / survival 방패 / skill 두루마리 / utility 마름모(조각) / status.guard 반원 방패 / status.cooldown 모래시계 / status.wait 점 세 개 / ui.pause 세로 막대 2 / ui.settings 톱니 / ui.close X
- 고유 검수 기준: (1) 20px 축소에서 17개가 서로 구분된다. (2) 적 아이콘 4개는 몸체 실루엣(DESIGN_SPEC 5절)과 같은 실루엣 규칙(사각·가는 세로·마름모·육각)이다.

## 공통 계약 규격
- 개별 캔버스 64×64, 안전영역 x 8..56 y 8..56, 피벗 [32,32]. RGBA straight alpha PNG. 시트 원본은 384×192(6×3, 간격 0).
- 파일: icons/{asset_id}.png 17개, batch.icons.main/source.svg

## 만드는 지시
> 384×192 캔버스를 64×64 칸 6열 3행으로 나누고, 왼쪽 위부터 행 우선으로 위 목록 순서대로 아이콘을 그린다. 모든 선은 #F2E9D8, 두께 5px, 선 끝과 모서리 둥글게, 채움 없음. 각 아이콘은 자기 칸의 x 8..56, y 8..56 안. 적 아이콘 4개(1~4번)만 실루엣을 #F2E9D8로 채우고 무기 부분을 4px 선으로 덧그린다. 18번 칸은 비운다. 넣지 말 것: 글자, 배경, 그림자, 두 가지 이상의 색.

## 규격 맞추는 지시
> job.pilot.icons. 시트를 64×64로 잘라 목록 순서(행 우선)대로 icon.enemy.grunt … icon.ui.close에 매핑한다. 18번은 버린다. 각 PNG의 불투명 영역이 x 8..56·y 8..56 안인지, 색이 #F2E9D8 단일(알파 제외)인지 검사한다. 20px와 32px 축소 연락판(contact sheet)을 만든다. manifest에 batch_id·순서·매핑·sha256 기록. 고유 검수 (1)(2) 결과 기록.
