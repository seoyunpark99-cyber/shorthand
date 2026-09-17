# 브리프: 3단계 몸체 3종 — visual.enemy.rapid.body, visual.enemy.chaser.body, visual.boss.executor.body

파일럿 판정 후 제작한다. 판정에서 제작 방식이 raster_generated로 바뀌면 이 브리프의 "만드는 지시"를 자연어 묘사로 바꾼 갱신본을 3단계 인계에서 받는다. 아래는 vector_authored 기준이다. 공통 규격·공정·검수 절차는 `briefs/pilot/visual.enemy.grunt.body.md`와 같고, 차이만 적는다.

## 공통 (세 에셋)
- project_id: shorthand · contract_version 1.0 · production_method: vector_authored · 원본 SVG · 교체 단위: asset
- 캔버스 112×112(보스는 160×160), 피벗 [56,96](보스 [80,136]), 안전영역(보스 x 24..136, y 16..144), PNG straight alpha, 트리밍 금지
- clips: idle(2f, 450ms 루프, f0002는 y −2px 호흡), cast(1f)
- 색: 몸체 #303A46, 외곽선 #1C232C 3px, 위협 부위 #FF9B54, 보스 인장 #E8C46A

## visual.enemy.rapid.body (job.p3.rapid_body)
- 형태: 세로로 가는 몸통(x 48..64, y 36..96), 가는 다리 두 개, 새부리 가면(머리 원 반지름 8 중심 (56,26)에 앞으로 뻗은 삼각 부리), 오른손에 바늘(3px 폭, 길이 30, 끝 #FF9B54).
- cast: 몸 전체를 y +10 낮추고(발 유지, 다리 접힘) 바늘을 수평으로 앞(왼쪽)으로 뻗음, 바늘 끝 #FF9B54.
- 고유 검수: (1) 56px에서 잔병(사각)과 실루엣 폭으로 구분(폭 절반 이하). (2) cast에서 바늘이 보임.
- 만드는 지시: 위 좌표·색을 그대로 사용. 넣지 말 것: 얼굴, 그림자, 배경.
- 규격 맞추는 지시: grunt와 동일 절차, 파일 visual.enemy.rapid.body/{idle/f0001,idle/f0002,cast/f0001}.png.

## visual.enemy.chaser.body (job.p3.chaser_body)
- 형태: 마름모 실루엣. 망토가 아래로 길게 찢어진 형태(마름모 (56,20)-(84,58)-(56,96)-(28,58), 아래쪽 꼭짓점을 세 갈래 찢김으로), 작은 머리(원 반지름 6, 중심 (56,16)), 망토 끝 갈래 중 하나 #FF9B54.
- idle f0002: 망토 갈래가 좌우 2px 흔들림(발 위치 유지).
- cast: 마름모 상단을 앞(왼쪽)으로 6px 기울이고 작은 칼날(x 24..34, y 56..60, 끝 #FF9B54) 돌출.
- 고유 검수: (1) 마름모 실루엣이 잔병·속사병과 구분. (2) 추적 점선(코드)과 함께 있을 때 몸체가 점선에 묻히지 않음(외곽선 대비).
- 규격 맞추는 지시: 동일. 파일 visual.enemy.chaser.body/...

## visual.boss.executor.body (job.p3.boss_body)
- 캔버스 160×160, 표시 80×80, 피벗 [80,136]. 점유는 1칸이므로 코드가 발밑에 1칸 점유 표시를 그린다(그림에 넣지 않음).
- 형태: 육각 실루엣 몸체(x 40..120, y 44..136), 큰 검(직사각형 x 118..130, y 20..120, 끝 #FF9B54), 왼쪽에 원형 인장판(원 중심 (36,70) 반지름 18, 채움 #303A46, 테두리 #E8C46A 4px, 안에 작은 원 #E8C46A).
- cast: 검을 수평으로 든다(직사각형 x 60..150, y 60..72, 끝 #FF9B54 오른쪽).
- 고유 검수: (1) 80px에서 금색 인장이 보인다(유일한 금색). (2) 잔병 옆에서 1.4배 크기로 읽히되 셀 밖으로 30px 이상 넘지 않는다.
- 규격 맞추는 지시: 160×160 PNG 3장, 피벗 y=136 검사, 80px 프리뷰를 잔병 옆에 합성. 파일 visual.boss.executor.body/...
