# 브리프: font.mono / font.ui — 글꼴 조달 (파일럿, library_sourced)

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · job_id: job.pilot.fonts · asset_id: font.mono, font.ui
- 사용: font.mono = 명령창(28px)·게이지 숫자(16px)·축약표(18px)·결과 로그(16px). font.ui = 나머지 UI 텍스트(한글 포함)
- 교체 단위: font(각)

## 제작 방식
- production_method: library_sourced · 원본: 배포 원본 파일 + 라이선스 원문
- 선택 기준: font.mono = JetBrains Mono (SIL OFL 1.1, 숫자 0과 O 구분, 좁은 폭). font.ui = Pretendard (SIL OFL 1.1, 한글 가독성). 두 글꼴 모두 상업 이용 가능 라이선스인지 원문을 확인하고 기록한다(미확인 상태로 납품 금지).

## 디자인 요구
- 고유 검수 기준: (1) mono 28px에서 `slash downright.` 16자가 명령창 폭 안(616−48px)에 들어간다. (2) ui 18px 한글 본문이 4.5:1 대비에서 읽힌다.

## 규격 맞추는 지시
> job.pilot.fonts. 각 글꼴의 TTF(또는 WOFF2)와 LICENSE 원문을 fonts/{font_id}/ 에 둔다. 사용 굵기: mono Regular·Bold, ui 400·600. manifest에 출처 URL·버전·라이선스 이름·조회일을 기록한다. 검수 (1)(2)는 텍스트 렌더 프리뷰 2장으로 확인한다.
