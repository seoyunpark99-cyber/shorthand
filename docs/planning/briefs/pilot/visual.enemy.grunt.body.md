# 브리프: visual.enemy.grunt.body — 잔병 몸체 (파일럿, 벡터)

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · contract_hash: shared/CONTRACT_HASH.txt
- job_id: job.pilot.grunt_body · asset_id: visual.enemy.grunt.body · variant_id: default
- clip_ids: visual.enemy.grunt.body.idle (f0001, f0002), visual.enemy.grunt.body.cast (f0001)
- 종류: 적 몸체 · 사용: run.hud 보드, 표시 56×56 · 목적: 가장 흔한 적. 대기 중인지 시전 중인지 포즈로 구분
- 만드는 파일: SVG 1 → PNG 3 · 교체 단위: asset

## 제작 방식
- production_method: vector_authored (후속: raster_generated 검토) · 이유·도구·원본 형식: visual.player.body와 동일 · batch_id: N/A

## 디자인 요구
- 형태: 사각에 가까운 어두운 갑옷 몸통, 얼굴 없는 투구(머리 부분이 빈 사각), 짧은 한손 칼. 채움 #303A46, 외곽선 #1C232C 3px. 칼끝만 #FF9B54.
- 56px에서 구분될 것: 사각 실루엣(속사병의 가는 세로, 추적자의 마름모와 다름), 시전 포즈에서 칼이 어깨 위로 올라간 것.
- 금지: 밝은 몸체색, 긴 무기, 얼굴.
- 고유 검수 기준: (1) idle과 cast 프레임을 56px에서 나란히 보면 "칼을 들었다"가 보인다. (2) 플레이어 옆에서 어둡게 읽힌다(밝기 대비 3:1 이상).

## 유형별 추가 지시
- states: idle(2f 호흡), cast(1f: 칼을 어깨 위로 수직에 가깝게 올림). 방향 없음. 그림자 코드.

## 공통 계약 규격
- visual.player.body와 동일 (112×112, 피벗 [56,96], 안전영역, PNG straight alpha, 트리밍 금지)
- 파일: visual.enemy.grunt.body/idle/f0001.png, f0002.png, cast/f0001.png, source.svg

## 애니메이션·합성
- idle 2×450ms 루프. cast 1프레임(시전 동안 유지). 합성 없음(단일 파츠).

## 제작·정규화·검수
- 공정·합격값·시도 상한: visual.player.body와 동일.

## 만드는 지시
> 112×112 캔버스, 발 접지점 (56,96). 몸통: 직사각형 x 36..76, y 40..96, 모서리 반지름 4, 채움 #303A46, 외곽선 #1C232C 3px. 투구: 직사각형 x 42..70, y 18..44, 같은 채움·외곽선, 안쪽에 가로 슬릿 (46,31)-(66,31) 선 #151A21 3px. 어깨: 몸통 좌우 상단에 작은 사각 x 30..38·y 42..54 와 x 74..82·y 42..54. 칼(idle): 오른손 위치 (80,70)에서 아래로 향한 짧은 칼, 직사각형 x 78..84, y 66..92 채움 #303A46, 칼끝 삼각형 (78,92)-(84,92)-(81,100) 채움 #FF9B54. f0002: 전체 y −2px(발 유지). cast: 칼을 어깨 위로 올린다. 직사각형 x 84..90, y 14..44, 칼끝 삼각형이 위를 향해 (84,14)-(90,14)-(87,6) 채움 #FF9B54. 팔 연결 선 (78,48)-(87,44) #303A46 4px. 넣지 말 것: 얼굴, 그림자, 배경.

## 규격 맞추는 지시
> job.pilot.grunt_body. PNG 3장 출력(idle/f0001, idle/f0002, cast/f0001). 피벗 y=96, 안전영역 검사. 트리밍 금지. 56px 프리뷰를 플레이어 옆에 합성. manifest에 clip·frame·경로·sha256 기록. 고유 검수 (1)(2) 결과 기록.
