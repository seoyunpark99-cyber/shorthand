# 브리프: visual.shard — 기억 조각 (파일럿, 벡터)

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · contract_hash: shared/CONTRACT_HASH.txt
- job_id: job.pilot.shard · asset_id: visual.shard · variant_id: default · clip: 없음(정지 1프레임)
- 종류: 필드 아이템 · 사용: run.hud 보드, 표시 24×24(캔버스 56 안 중앙) · 목적: 경험치가 바닥에 있음을 알림. 수량 텍스트는 코드가 옆에 렌더
- 만드는 파일: SVG 1 → PNG 1 · 교체 단위: asset

## 제작 방식
- production_method: vector_authored (최종도 벡터 유지 예정: 형태가 단순 도형) · 원본 SVG

## 디자인 요구
- 형태: 세로로 긴 마름모, 채움 #93C7FF, 중앙에 작은 밝은 심 #F2E9D8, 외곽선 #1C232C 2px. 발광 없음(정보 우선순위가 낮다).
- 고유 검수 기준: (1) 바닥 무늬와 위험 빗금 위에서 모두 식별된다. (2) 플레이어 몸체보다 눈에 덜 띈다(면적·명도).

## 공통 계약 규격
- 캔버스 112×112, 표시 56×56, 마름모는 캔버스 중앙 48×48 안(x 32..80, y 24..88). 피벗 [56,56]. RGBA straight alpha PNG. 트리밍 금지.
- 파일: visual.shard/base.png, source.svg

## 만드는 지시
> 112×112 캔버스 중앙에 마름모 (56,26)-(78,56)-(56,86)-(34,56), 채움 #93C7FF, 외곽선 #1C232C 2px. 중앙에 작은 마름모 (56,48)-(62,56)-(56,64)-(50,56) 채움 #F2E9D8. 넣지 말 것: 발광, 그림자, 글자.

## 규격 맞추는 지시
> job.pilot.shard. 112×112 PNG 1장 출력, 알파 확인, 불투명 영역이 x 32..80·y 24..88 안인지 검사. tile.floor 위와 위험 빗금 위에 56px로 올린 프리뷰 2장. manifest 기록. 고유 검수 (1)(2) 결과 기록.
