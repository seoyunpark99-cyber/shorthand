# 브리프: batch.tiles.yard — 바닥·벽 타일 묶음 (파일럿, 벡터)

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · contract_hash: shared/CONTRACT_HASH.txt
- job_id: job.pilot.tiles · batch_id: batch.tiles.yard · 포함 asset_id: tile.floor, tile.floor_alt, tile.wall (순서 1,2,3)
- 종류: 타일 · 사용: run.hud 보드 121칸(외곽 40칸 벽, 내부 81칸 바닥, 그중 약 20% floor_alt) · 표시 56×56
- 만드는 파일: SVG 1(세 타일을 가로로 나열) → PNG 3 · 교체 단위: batch

## 제작 방식
- production_method: vector_authored (후속: raster_generated 질감 검토) · 도구: SVG 작성 후 래스터화 · 원본 SVG
- 묶음 이유: 세 타일의 경계 4px가 같은 먹색이어야 이음새가 없다. 한 원본에서 만들면 값이 어긋나지 않는다.

## 디자인 요구
- floor: 먹색 #151A21 바탕, 아주 희미한 격자선(경계 안쪽 #1A2028 1px)과 중앙에 옅은 지워진 글자 흔적 느낌의 짧은 선 2~3개(#1C232C). 대비는 바탕 대비 1.3:1 이하.
- floor_alt: floor와 경계 동일, 중앙 흔적의 방향·개수만 다름.
- wall: 청회색 #303A46 면, 안쪽(보드 중심 쪽) 모서리에 2px 어두운 선 #1C232C. 같은 타일을 네 변에 반복하므로 방향성 없는 대칭 무늬.
- 고유 검수 기준: (1) 11×11 합성 프리뷰에서 바닥 이음새가 보이지 않는다. (2) 위험 칸 빗금(#FF9B54 4px 간격)을 올렸을 때 바닥 무늬와 혼동되지 않는다.

## 공통 계약 규격
- 캔버스 112×112, 표시 56×56, 피벗 [0,0]. 알파 없음(불투명). PNG sRGB. 트리밍 금지.
- 파일: tile.floor/base.png, tile.floor_alt/base.png, tile.wall/base.png, batch.tiles.yard/source.svg

## 제작·정규화·검수
- 공정: SVG 336×112(3칸 가로) 작성 → 112×112 3장으로 분할 → 11×11 합성 프리뷰(내부 난수 배치 시드 1) → 위험 칸 오버레이 프리뷰
- 시도 상한 3회.

## 만드는 지시
> 336×112 캔버스에 112×112 타일 세 장을 왼쪽부터 floor, floor_alt, wall 순으로 그린다. floor: 사각 전체 #151A21. 바깥 4px 띠는 그대로 #151A21. 안쪽 x 4..108, y 4..108 테두리에 1px 선 #1A2028. 중앙 부근에 짧은 가로 선 두 개 (30,50)-(70,50), (40,64)-(84,64) 색 #1C232C 두께 2px, 끝 둥글게. floor_alt: floor와 같되 중앙 선을 세로로 (52,34)-(52,70), (66,44)-(66,80). wall: 사각 전체 #303A46. 안쪽 x 8..104, y 8..104에 2px 테두리 #1C232C. 중앙에 대칭 십자 흔적 (56,40)-(56,72), (40,56)-(72,56) 색 #283140 3px. 넣지 말 것: 그라데이션, 질감, 글자.

## 규격 맞추는 지시
> job.pilot.tiles. 336×112 출력을 x 0..112, 112..224, 224..336으로 잘라 tile.floor, tile.floor_alt, tile.wall에 매핑한다(왼쪽부터 순서). 각 112×112, 불투명 PNG. 11×11 보드 합성 프리뷰(외곽 wall, 내부 floor, 내부 20%를 시드 1 난수로 floor_alt)를 preview_board.png로, 같은 프리뷰에 (4,5) 칸 주황 빗금을 올린 preview_danger.png를 만든다. manifest에 batch_id·자르는 순서·매핑·sha256을 기록한다. 고유 검수 (1)(2) 결과 기록.
