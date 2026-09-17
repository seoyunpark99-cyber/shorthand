# RESUME_PLANNING — 파일럿 판정을 새 세션에서 재개하는 프롬프트

이 대화를 이어갈 수 있으면 여기에 두 세션의 파일럿 반환물을 그대로 가져오면 된다. 이어갈 수 없을 때 아래 블록으로 새 대화를 연다. 첨부: 기획 기준본(`02_planning/` 전체 또는 `PLANNING_BASELINE.zip`), 디자인 파일럿 납품 ZIP과 `FROM_DESIGN.md`, 개발 파일럿 반환(캡처·임포트 보고서·실행물 또는 실행 방법)과 `FROM_DEV.md`. `00_log/`·`feedback/`는 기획 세션이 이어서 쓰므로 프로젝트 폴더 위치를 알려 준다.

---

[사용하는 환경에 맞는 한 줄을 프롬프트 맨 앞에 두세요]
- Claude 앱: 02-game-planning-handoff 스킬을 사용해 아래 작업을 시작하라.
- Claude Code: /02-game-planning-handoff
- ChatGPT: @02-game-planning-handoff
- Codex: $02-game-planning-handoff
- 스킬을 설치할 수 없는 환경: 첨부한 02-game-planning-handoff 스킬 폴더(zip)의 SKILL.md를 먼저 읽고, 그 지시와 참고 문서를 따라 아래 작업을 시작하라.

첨부한 기획 기준본으로 `shorthand / SHORTHAND MVP`의 **파일럿 판정(2단계)** 을 재개하라. `PROJECT_CONTROL.md`의 재개 블록부터 읽고, spec_version 1.0·contract_version 1.0·pilot_set_id pilot.hud_combat을 확인하라. 과거 대화에 접근할 수 있다고 가정하지 마라.

첨부한 디자인 파일럿 납품(delivery/manifest.json, 원본, 프리뷰, FROM_DESIGN.md)과 개발 파일럿 반환(교체 전후 캡처, 임포트 보고서, FROM_DEV.md)을 받아 다음을 수행하라: (1) 반환물이 파일럿 세트 전체 ID를 포함하고 계약 버전이 맞는지 확인, (2) 규격 검사·고유 검수 결과 확인, (3) 개발 캡처로 실제 게임 화면을 사용자와 함께 판정(크기감·읽힘·어울림·움직임·소리; 스타일 승인은 사용자), (4) 문제를 에셋 결함·지시문·규격·제작 방식과 도구·개발 구현으로 분류하고 가장 근본 원인부터 수정, (5) 판정 결과(통과 / 수정 후 통과 / 재파일럿)를 기록하고 계약·브리프·스택을 새 버전으로 발행, (6) 바뀐 내용만 담은 개발용·디자인용 이어가기 인계와 시작 프롬프트, 최종 통합 지시를 만들고 정지.

FROM_DEV.md·FROM_DESIGN.md는 프로젝트 폴더 `feedback/`에 저장하고 원장에 옮긴 뒤 `feedback/FEEDBACK_TO_02.md`를 갱신하라. 3단계 제작과 통합을 직접 수행하지 마라.
