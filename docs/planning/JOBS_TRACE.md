# JOBS_TRACE — 작업표·요구 추적·파일럿 세트

- project_id: shorthand · spec_version 1.0 · contract_version 1.0
- 제작 단계: 0 기획 완료 → 1 파일럿 제작(이 인계) → 2 판정(기획 세션) → 3 전수 제작 → 4 통합
- pilot_set_id: **pilot.hud_combat** (대표 화면 L-HUD 전투 장면)

## 1. 파일럿 세트

| 트랙 | job_id | 대상 | production_method / 도구 | 왜 파일럿에 포함 |
|---|---|---|---|---|
| design | job.pilot.ref_shot | ref.shot.hud (2~3안, 사용자 승인) | raster_generated / gpt-image-2.5 | 기준 그림. 생성 도구·스타일 문단 검증 |
| design | job.pilot.player_body | visual.player.body (3프레임) | vector_authored | 몸체 규격·피벗·가독성 |
| design | job.pilot.grunt_body | visual.enemy.grunt.body (3프레임) | vector_authored | 적 대비·시전 포즈 |
| design | job.pilot.tiles | batch.tiles.yard (3) | vector_authored (묶음) | 묶음 방식·이음새 |
| design | job.pilot.shard | visual.shard | vector_authored | 정보 우선순위 |
| design | job.pilot.icons | batch.icons.main (17) | vector_authored (묶음) | 묶음·축소 가독성 |
| design | job.pilot.card_panel | ui.panel.card (2상태) | vector_authored | 9-slice |
| design | job.pilot.fonts | font.mono, font.ui | library_sourced | 라이선스·폭 |
| design | job.pilot.audio | audio.type_key, audio.hit_slash, audio.cast_warning | audio_generated / ElevenLabs | 오디오 도구·규격 |
| dev | job.dev.01 ~ job.dev.09 (아래) | HUD 전투 화면 동작 + 교체 경로 | code | 파일럿 에셋을 넣어 캡처 반환 |

디자인 세션은 위 9개 job 납품 후 **멈춘다.** 개발 세션은 파일럿 반환 후 판정에 영향받지 않는 작업(2절의 "보류" 표시가 없는 것)을 계속한다.

## 2. 개발 작업표

| job_id | 목적 | 선행 | 입력 | 출력 | 수락 기준 | 검사 | 파일럿 후 보류 |
|---|---|---|---|---|---|---|---|
| job.dev.01 프로젝트 골격 | TS+Phaser+Vite+Vitest+Electron 초기화, 데이터 로더·스키마 검증, 버전 대조 | — | data/*.json, shared/*.json | 실행되는 빈 창, `npm test` 통과 | TECH_QA 7절 명령 setup/run/test 동작. Phaser 4 한글 Text 렌더·IME compositionstart 동작 확인 기록 | T-INPUT-01(수동) | 아니오 |
| job.dev.02 sim.core + parser | GAME_SPEC 2절 전체(플레이어 행동, 적 상태기계, 스텝 순서, 이벤트) | 01 | GAME_SPEC, data | 순수 TS 모듈 | 시나리오 S-01~S-16 테스트 통과 | T-SIM-*, T-PARSE-*, T-CANCEL, T-CHASER, T-GUARD, T-HIT, T-ATTACK, T-DEATH, T-CLEAR, T-SKILL | 아니오 |
| job.dev.03 growth + spawn + difficulty + boss | 카드 후보·적용, 밴드 스폰, M(t), 보스 패턴 | 02 | data | 모듈 | T-OFFER, T-LEVEL, T-SPAWN, T-GEN, T-DIFF, T-BOSS 통과 | 동상 | 아니오 |
| job.dev.04 replay + sim.bot | 기록·재생·시드 재현, 가상 플레이어(WPM·반응·정책 abbr-first/perf-first/dodge-only) | 02, 03 | — | `npm run sim`, `npm run replay` | T-SIM-01, T-SIM-BOT, T-SIM-BOT-DODGE 보고서 생성. 봇 결과가 GAME_SPEC 6절 허용 범위 밖이면 파라미터 조정 근거를 PROJECT_CONTROL 변경표에 기록(허용 범위 안에서만) | — | 아니오 |
| job.dev.05 assets.resolver + placeholder + 검사기 | 계약 로드, 기본 에셋 생성 스크립트, manifest 검사·임포트·교체·복귀 | 01 | shared/asset_contract.json | `npm run assets:placeholder`, `assets:import` | T-ASSET-01/02 (프레임 누락·피벗 오류·버전 불일치 검출) | 자동 | 아니오 |
| job.dev.06 render.board + hud(링·게이지·명령창·사이드) + VFX | L-HUD 화면. DESIGN_SPEC 7.2~7.4, 8절 코드 렌더링 | 02, 05 | ui_tokens, strings | 전투 화면 | fixture pilot_hud 캡처, T-UI-01·02·08 | 캡처 | **부분 보류**: 링 반지름·타일 56px·몸체 표시 크기 등 계약 수치에 기대는 배치는 판정 후 확정. 구현은 진행하되 수치를 토큰으로 외부화 |
| job.dev.07 input.layer | 키·IME·포커스·키 반복·카드 번호 격리·일시정지 | 01, 02 | — | 모듈 | T-INPUT-01~03 (수동 포함) | 수동 | 아니오 |
| job.dev.08 screens + save + audio | 타이틀·레벨업·일시정지·설정·결과·기록, 저장, 큐 재생 | 03, 05, 06 | strings, ui_tokens | 8화면 동작 | T-UI-03~07, T-SAVE-01, T-AUDIO-01, T-E2E-01 | 자동+캡처 | **보류**: 레벨업 카드 패널(9-slice)·아이콘 배치는 판정 후. 나머지 진행 |
| job.dev.09 파일럿 교체·반환 | 디자인 파일럿 납품을 임포트해 교체, 캡처 | 05, 06, 디자인 파일럿 도착 | delivery/ | 교체 전후 캡처, 임포트 보고서, FROM_DEV.md | PHASES_AND_PILOT 4절 반환물 전부 | — | 파일럿 종료점 |
| job.dev.10 패키징 | Electron Windows 빌드, 새 폴더 재현 | 08 | — | exe | TECH_QA 7절 build, ZIP 단독 재현 보고 | 수동 | 3단계 |
| job.dev.11 시험 준비 | 로컬 로그 수집, 참가자용 안내, F3 비활성 빌드 | 10 | — | 시험 빌드 | GAME_SPEC 11절 시험 계획 실행 가능 | — | 3단계 |

## 3. 디자인 3단계 작업표 (판정 후 이어가기 인계로 활성)

| job_id | 대상 | 브리프 |
|---|---|---|
| job.p3.rapid_body / chaser_body / boss_body | 몸체 3 | briefs/phase3/enemy_bodies.md |
| job.p3.layout_title / hud / levelup / pause / result | 화면 구성 5(+records 빈 목록) | briefs/phase3/screen_layouts.md |
| job.p3.audio | 13큐 | briefs/phase3/audio_phase3.md |
| job.p3.body_raster (조건부) | 판정에서 몸체를 raster_generated로 바꾸면 5종 재제작 | 3단계 인계에서 갱신 브리프 |

## 4. 요구 추적 (TRACE)

| requirement | 규칙·데이터 | 화면·에셋 | 테스트 | dev job | design job |
|---|---|---|---|---|---|
| RQ-01 링 게이지 | R-CAST, R-DIFFICULTY | hud.ring, icon.enemy.* | T-UI-01 | 06 | pilot.icons |
| RQ-02 타이핑 즉시 실행 | 2.2, 2.3 | hud.command_bar, audio.type_key | T-PARSE-*, T-INPUT-01 | 02, 07 | pilot.audio |
| RQ-03 벗어나기·반격 | act.move, act.slash | fx.*, board.danger_cell | T-CANCEL-01 | 02, 06 | — |
| RQ-04 축약 2+성능 1 | R-OFFER | screen.levelup, ui.panel.card, icon.card.* | T-OFFER-01, T-UI-04 | 03, 08 | pilot.card_panel, pilot.icons, p3.layout_levelup |
| RQ-05 시간 난도 | R-DIFFICULTY, R-SPAWN | hud.clock | T-DIFF-01, T-SPAWN-* | 03 | — |
| RQ-06 피격 원인 | ev.player_hit | hud.hit_reason, screen.result | T-UI-02, T-UI-06 | 06, 08 | p3.layout_result |
| RQ-07 보스 | R-BOSS | visual.boss.*, fx.boss_line | T-BOSS-* | 03, 06 | p3.boss_body |
| RQ-08 전체 화면 흐름 | UI_UX | screen.* | T-UI-03~07, T-E2E-01 | 08 | p3.layout_* |
| RQ-09 재현성 | 2.2 | — | T-SIM-01 | 04 | — |
| RQ-10 IME·포커스 | 2.2 | overlay.* | T-INPUT-01/02 | 07 | — |
| RQ-11 봇 튜닝 | 6절 | — | T-SIM-BOT | 04 | — |
| 몸체·타일·조각 표시 | asset_contract | visual.*, tile.* | T-ASSET-*, 캡처 | 05, 06, 09 | pilot.* / p3.* |
| 오디오 | audio_cues | audio.* | T-AUDIO-01 | 08 | pilot.audio, p3.audio |

## 5. 검사 인덱스 (현재 유효한 검사)
기획 단계에서 실행한 검사: 없음(전부 not_run). 문서 검사는 `FINAL_REVIEW_RESULT.md`. 개발·디자인 세션이 run_id·입력 해시·증거 경로를 채운다.
