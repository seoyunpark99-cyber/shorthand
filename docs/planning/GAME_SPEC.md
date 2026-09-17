# GAME_SPEC — SHORTHAND MVP (5분 압축판)

- project_id: shorthand · spec_version: 1.0 · contract_version: 1.0 · 기준일: 2026-09-17
- 상태: spec=approved(사용자 일괄 승인 대기 표시는 PROJECT_CONTROL 참조) · production=not_started · verification=not_run
- 기준 문서: `01_ideation/GAME_CONCEPT_0.md` v0.1 (APPROVED_0). 이 문서는 그 LOCKED_0 결정(D-01~D-05)을 실제 값으로 닫는다.
- 데이터 원본: `data/commands.json`, `data/cards.json`, `data/enemies.json`, `data/gauge_and_spawn.json`. 본문과 데이터가 다르면 데이터를 고치고 본문을 맞춘다. 두 곳에 같은 값을 따로 쓰지 않기 위해 본문은 규칙과 예외를, 데이터는 수치를 맡는다.

## 1. 제품 정의

**한 문장.** 8방향 격자 한가운데서, 초 단위로 차오르는 적의 공격 게이지를 보고 명령을 타이핑해 비켜서거나 되받아치는 실시간 타이핑 액션 로그라이트. 시간이 갈수록 적은 빨라지고, 레벨업마다 명령어를 축약해 같은 손으로 더 많이 살아남는다.

**이 명세의 범위.** MVP = 5분 압축판 + 보스 1패턴. 검증 질문은 하나다: *"적이 빨라지는 속도와 내 명령이 짧아지는 속도가 맞붙을 때, 살아남는 것이 재미있는가."* MVP는 제품이 아니라 검증 도구다. 그러나 적·카드·스폰·보스는 데이터로 정의해 첫 출시 층(15분 런, 적 6종, 직업 3종, 아레나 추가, 해금)이 코드 구조 변경 없이 붙을 수 있게 한다.

| 항목 | 값 | 근거 |
|---|---|---|
| 타깃·이용 상황 | 타이핑 게임의 손맛과 서바이버류의 성장 쾌감을 아는 PC 플레이어. 한 판 5분(MVP) | GAME_CONCEPT_0 4절 |
| 핵심 재미·선택 | 게이지 안에 명령을 완성할 수 있는가. 비켜서 미룰까(짧음), 베어서 지울까(김). 무엇을 먼저 줄일까 | D-01, D-02 |
| 비교작과 차이 | 타이핑 게임은 단어 정확도, 서바이버류는 자동 공격 성장. 이 게임은 "내가 치는 언어 자체"가 성장 대상 | GAME_CONCEPT_0 2절 |
| 플랫폼·입력·화면 | Windows 10 이상, 물리 키보드 영문 입력, 1280×720 기준 16:9 창 모드(전체화면 옵션). 마우스는 메뉴만 | DC-03 |
| 모드·인원·세션 | 싱글, 오프라인, 한 런 약 5분. 런 중 저장 없음 | D-03 |
| 승패 | HP 0이면 사망. 보스 처치면 클리어. 결과 화면에 기록 | 5절 |
| 첫 출시 포함·제외 | GAME_CONCEPT_0 10절의 세 층 표를 따른다 | D-07 |
| 제작비·일정 | 1인, 코딩 에이전트와 생성 서비스 사용. 일정·예산 미정(OPEN-08 → DC-01) | DC-01 |
| 수익화 | MVP는 비상업 검증판. 첫 출시 가설은 유료 완결형(Steam 상정), 가격·시장 미조사. MVP 성공 기준은 11절의 시험 기준 | GAME_CONCEPT_0 4절 |

**대표 플레이 (시간 순, MVP).**

| 시각 | 사용자 행동 | 게임 상태 변화 | 화면·음향 | 예외 |
|---|---|---|---|---|
| 0:00 | 타이틀에서 Enter, "시작" 선택 | 런 생성(시드), 보드 11×11, 플레이어 (5,5), 잔병 1 (4,5) 배치, 세계 정지 | "입력하면 시작" 안내, 왼쪽 링에 게이지 8.0 표시(정지) | — |
| 0:00 | `slash left.` 입력(11자, 약 3~5초) | 첫 문자에 런 시계 시작, 게이지 진행. 완성 순간 잔병 피해 2 → 사망, 조각 1 XP 드롭 | 청록 초승달, 잔병 붕괴, 조각 마름모, 조각이 반경 1 안이라 즉시 흡수 → XP 1/3 | 게이지가 먼저 차면 피격 HP 4, 원인 문구 "왼쪽 잔병, 명령 미완성(8/11자)" |
| 0:06~0:45 | 잔병이 6초 간격 등장, 대응 | 처치 3회 → XP 3/3 → 레벨업 대기열 | 레벨업 광선·종소리, 세계 정지, 카드 3장(A01·A03·A06 고정) | 여러 레벨 동시 달성이면 하나씩 선택 |
| 0:45 | 카드 선택 (예: A01 베기 축약 I) | slash → sl 허용. 버퍼 보존 | 카드에 `slash left.` 11자 → `sl left.` 8자 표시, 선택 후 축약표 갱신 강조 | 선택 전 Esc 불가(선택 필수) |
| 1:30 | 속사병 등장(게이지 2.3초) | 짧은 명령 필요 | 링에 속사병 아이콘, 게이지 바가 붉게 빠름 | 못 피하면 HP −1 |
| 2:30 | 추적자 등장 | 인접 안 이동은 소용없음, 벗어나거나 베어야 함 | 점선 추적 표시, 마지막 1초 실선 고정 | — |
| 4:30 | 일반 스폰 정지, 보스 등장 | 삭제선 패턴 반복 | 보스 예고 두 줄 순차, 회복 창 3초 | 285초에는 잔적이 있어도 등장 |
| ~5:00 | 보스 HP 0 | 클리어, 남은 조각 회수, 결과 화면 | 결과: 생존 시간, 레벨, 처치 수, 선택 순서, 피격 원인 목록, 마지막 10초 기록 | 사망 시 같은 화면에 "사망" 표기, 같은 시드/새 시드 재도전 |

## 2. 상태·입력·규칙

### 2.1 상태 스키마

| state_field | 타입 | 단위·좌표 | 범위 | 기본값 | 권위 모듈 | 저장 | 오류 처리 |
|---|---|---|---|---|---|---|---|
| run.seed | uint32 | — | 1..2^32−1 | 시작 시 생성 | run | 결과 기록에만 | 0이면 1 |
| run.clock_s | float | 초 | ≥0 | 0 | sim | 아니오 | 정지 상태에서는 증가하지 않음 |
| run.phase | enum | — | waiting_first_input, combat, levelup, paused, result | waiting_first_input | run | 아니오 | — |
| board | 11×11 cell | (x,y) 왼쪽 위 원점 | 0..10 | 외곽 벽 | sim | 아니오 | — |
| player.cell | int2 | 칸 | 내부 1..9 | (5,5) | sim | 아니오 | 벽·점유 칸이면 이동 실패 |
| player.hp / hp_max | int | — | 0..8 | 5/5 | sim | 아니오 | hp 0 → 사망 |
| player.level / xp | int | — | ≥1 / ≥0 | 1/0 | growth | 아니오 | 초과 XP 보존 |
| player.cards[] | {id, rank} | — | cards.json | [] | growth | 아니오 | 최대 랭크 초과 금지 |
| player.skills[] | id[] | — | ≤1 | [] | growth | 아니오 | 슬롯 초과 시 A10 미제시 |
| player.guard | {dir, remaining_s} 또는 null | 초 | — | null | sim | 아니오 | 새 막기는 교체 |
| player.cooldowns{} | id→초 | 초 | ≥0 | {} | sim | 아니오 | — |
| player.buffer | string | — | ≤24자 | "" | input | 아니오 | 초과 무시 |
| enemies[] | {id, type, cell, hp, state, timers, telegraph_cells[]} | — | — | [] | sim | 아니오 | 생성 ID 오름차순 처리 |
| shards[] | {cell, xp} | — | — | [] | sim | 아니오 | 같은 칸 합산 |
| levelup_queue | int | 회 | ≥0 | 0 | growth | 아니오 | 하나씩 처리 |
| spawn.next_at_s / band | float / int | 초 | — | 0 / 0 | spawn | 아니오 | — |
| profile.settings | {volume, input_sound, weak_fx, fullscreen} | — | — | 기본값 | save | 예(로컬) | 손상 시 기본값 복원 |
| profile.records[] | 결과 요약 | — | — | [] | save | 예(로컬) | 최근 50개 유지 |

불변조건: 칸당 살아 있는 유닛 1개. HP는 0 아래로 내려가지 않는다. 시전 중인 적의 telegraph_cells는 비어 있지 않다. 레벨업 화면 중 run.clock_s는 증가하지 않는다.

### 2.2 시간 모델

- 시뮬레이션은 50ms 고정 스텝. 렌더링은 별도(가변 프레임). 입력은 OS 이벤트 도착 시각이 아니라 "다음 스텝 시작"에 처리한다. 판정이 렌더 프레임에 우연히 묶이지 않게 하기 위해서다.
- 한 스텝에 여러 키 이벤트가 있으면 도착 순서대로 모두 처리한다(빠른 타자에서 50ms 안에 2글자 가능).
- 런 시계는 첫 유효 문자 입력에서 시작한다. 정지 조건: 레벨업 화면, 일시정지(F10 또는 Esc 2회), 창 포커스 상실, IME 조합 감지(영문 전환 안내 표시). 정지 중에는 모든 타이머(게이지·막기·쿨다운·스폰·난도)가 멈추고, 재개 시 추가 유예는 없다.
- 난수 호출 시점: 카드 후보 생성 시(카드 스트림), 스폰 위치·종류 결정 시(스폰 스트림). 그 외 난수 없음. 같은 시드·같은 입력 시각 기록으로 같은 결과가 나와야 한다(재현성 테스트 T-SIM-01).

### 2.3 입력·행동 표

| action_id | 행위자 | 허용 상태·전제 | 입력 | 비용·쿨다운 | 처리 순서 | 출력·이벤트 | 무효 입력 | 다음 상태 |
|---|---|---|---|---|---|---|---|---|
| input.char | 플레이어 | phase=combat 또는 waiting_first_input | a-z, 1-9, 공백, 마침표 | 없음(시간 자체가 비용) | 버퍼에 추가 → 파싱 | ev.buffer_changed, 완성 시 ev.command_complete | 허용 외 문자 무시, 24자 초과 무시 + 테두리 경고 | 완성이면 해당 행동 |
| input.backspace | 플레이어 | 동상 | Backspace | — | 마지막 문자 삭제 | ev.buffer_changed | 빈 버퍼면 무시 | — |
| input.escape | 플레이어 | 동상 | Esc | — | 버퍼 비움. 빈 버퍼에서 Esc면 일시정지 | ev.buffer_cleared / ev.pause | — | — |
| act.slash | 플레이어 | 완성 명령 | 방향 | 없음 | 대상 칸 = player.cell + dir. 적 있으면 피해(2 + A06) → 사망 판정 → 생존 시 시전 중단 | ev.hit / ev.kill / ev.miss | 대상 없으면 빈 공격 표시 | 버퍼 비움 |
| act.thrust | 플레이어 | 완성 명령 | 방향 | 없음 | 직선 1..3칸 중 첫 적. 벽에서 멈춤 | 동상 | 동상 | 버퍼 비움 |
| act.guard | 플레이어 | 완성 명령 | 방향 | 없음 | player.guard = {dir, duration(3.0 + A09)} 교체 | ev.guard_set | — | 버퍼 비움 |
| act.move | 플레이어 | 완성 명령 | 방향 | 없음 | 목적지가 내부 바닥·비점유·비예약이면 이동. 대각선은 양옆 직교 칸이 모두 벽일 때만 불가(MVP는 내부 벽 없음) | ev.move / ev.move_fail | 실패 시 버퍼만 비움 | 이동 후 고정형 예고 칸 이탈 검사 |
| act.spin | 플레이어 | A10 보유, 쿨다운 0 | 방향 | 쿨다운 4.0초 | 방향과 양옆 45도의 인접 3칸 각각 독립 판정, 적 ID 순 | ev.hit×n | 쿨다운 중 완성이면 실패 표시, 쿨다운 유지, 버퍼 비움 | — |
| ui.card_select | 플레이어 | phase=levelup | 1/2/3 강조, Enter 또는 클릭 확정 | — | 카드 적용 → 대기열 −1 → 0이면 combat 복귀 | ev.card_applied | 카드 번호 키는 전투 버퍼에 새지 않음 | combat 또는 다음 카드 |

명령 완성 시각과 게이지 만료가 같은 스텝이면 **플레이어 행동을 먼저** 처리한다(2.5절 순서). 축약이 있어도 같다.

### 2.4 개체·효과 규칙

| rule_id | 대상 | 조건·속성 | 생성·갱신·소멸 | 상호작용 | 중첩·상한 | 우선순위 | 표시 binding | 테스트 |
|---|---|---|---|---|---|---|---|---|
| R-ENEMY-STATE | 모든 적 | approach → cast → attack → recovery → approach | 등장 후 다음 스텝부터 approach | 중단·취소 시 recovery(1.5초) | — | ID 순 | enemy.state_icon | T-ENEMY-01 |
| R-CAST | 시전 중 적 | cast_s = cast_s_base × M(t) (시전 시작 시각의 M을 고정) | 인접 달성 다음 스텝 시작. remaining이 0 이하가 되는 스텝에 공격 | 같은 방향 시전 상한 2, 초과분은 대기 아이콘 | 방향당 2 | — | ring.gauge(dir) | T-CAST-01 |
| R-FIXED-TELEGRAPH | grunt, rapid | 시전 시작 시 플레이어 칸 고정 | 플레이어가 그 칸을 벗어나면 즉시 취소 → recovery | — | — | — | board.danger_cell | T-CANCEL-01 |
| R-TRACK-TELEGRAPH | chaser | 플레이어가 인접 칸 안에서 이동하면 예고 칸 갱신. 인접 밖이면 취소. 마지막 1.0초는 고정 | — | — | — | — | board.danger_cell(tracking) | T-CHASER-01 |
| R-ATTACK | 시전 완료 적 | 대상 칸에 플레이어 있으면: guard 방향 일치 → guard 소모(피해 0) / 아니면 hp −damage | 공격 후 recovery | 같은 스텝의 두 공격은 별개. 막기는 1회만 | — | 낮은 ID 먼저 | fx.enemy_attack, hud.hit_reason | T-ATTACK-01 |
| R-GUARD | 플레이어 | 방향 1개, 1회, 지속 3.0초(+A09) | 새 막기는 교체(방향 달라도) | 관통 공격 없음(MVP) | 1개 | — | player.guard_arc | T-GUARD-01 |
| R-DAMAGE-ORDER | 명중 | 피해 → 사망 → 생존이면 시전 중단(cast 상태일 때만) | — | approach/recovery 중인 적은 피해만 | — | — | — | T-HIT-01 |
| R-XP-DROP | 적 사망 | 사망 칸에 xp 조각. 벽이면 가장 가까운 바닥 | 소멸 없음 | 같은 칸 합산 | — | — | board.shard | T-XP-01 |
| R-PICKUP | 플레이어 | Chebyshev 반경(1 + A12) 안 조각 흡수 | 매 스텝 검사 | 레벨업 화면 중에는 흡수하지 않음 | — | — | fx.pickup, hud.xp_bar | T-XP-02 |
| R-LEVELUP | 플레이어 | xp ≥ xp_next(L) → L+1, xp −= xp_next, 대기열 +1 | 스텝 끝에 대기열 > 0이면 phase=levelup | 사망과 같은 스텝이면 사망 우선 | — | — | screen.levelup | T-LEVEL-01 |
| R-OFFER | growth | cards.json offer_rules | 첫 레벨업 고정 A01/A03/A06 | 최대 랭크·선행 조건·스킬 슬롯 검사 | — | — | screen.levelup.cards | T-OFFER-01 |
| R-DIFFICULTY | sim | M(t) = max(0.30, 0.88^floor(t/30)) | 런 시계 기준 | 보스 회복 시간에는 미적용 | — | — | hud.clock, ring.gauge | T-DIFF-01 |
| R-SPAWN | spawn | gauge_and_spawn.json bands | interval마다 시도, max_alive 초과 시 건너뜀 | 예약 칸 이동 금지 | max_alive | — | board.spawn_marker | T-SPAWN-01 |
| R-BOSS | boss | 중단 면역, 거리 2 정렬, 삭제선 패턴 | 270초 조건 등장 | 보스 시전 중 플레이어 이동으로 예고 칸이 바뀌지 않음(직선 고정) | — | — | boss.* | T-BOSS-01 |
| R-DEATH | 플레이어 | hp 0 | phase=result | 같은 스텝의 XP·레벨업 무시 | — | 최우선 | screen.result | T-DEATH-01 |
| R-CLEAR | 보스 사망 | 남은 조각 일괄 회수(레벨업 화면 열지 않음) → phase=result | — | — | — | — | screen.result | T-CLEAR-01 |

### 2.5 한 스텝의 처리 순서

1. 정지 상태면 아무것도 하지 않는다.
2. 이번 스텝에 도착한 입력을 순서대로 버퍼에 반영하고, 반영할 때마다 파싱한다. 완성 명령이면 즉시 플레이어 행동을 처리한다(피해·사망·중단·이동·막기·쿨다운 시작). 한 스텝에 명령 두 개가 완성될 수 있다.
3. 플레이어 이동으로 고정형 예고 칸을 벗어났으면 해당 시전을 취소하고 적을 recovery로 보낸다. 추적형은 R-TRACK-TELEGRAPH.
4. 스텝 시작 시 살아 있던 적을 ID 오름차순으로 갱신한다: approach(이동 타이머), cast(remaining −0.05), recovery(타이머), 보스 패턴 진행. 이번 스텝에 새로 시작한 시전은 줄이지 않는다.
5. remaining ≤ 0인 시전의 공격을 ID 순으로 판정한다(R-ATTACK). 플레이어 사망이면 이후 6~8을 건너뛰고 result로 간다.
6. 막기 지속·쿨다운·스폰 타이머·난도 시계를 0.05초 줄인다(이번 스텝에 새로 만든 타이머 제외).
7. 흡수 반경 안 조각을 흡수하고 레벨업 횟수를 계산한다. 스폰 시도, 보스 등장 조건, 클리어 조건을 처리한다.
8. 레벨업 대기열 > 0이면 phase=levelup(세계 정지). 아니면 다음 스텝.

### 2.6 이벤트 표

| event_id | 시점 | 속성 | 권위 → 소비 | 중복 정책 | 시각·음향 |
|---|---|---|---|---|---|
| ev.buffer_changed | 2단계 | buffer, valid_prefix(bool), candidates[] | input → hud | 매 문자 | cue.type_key, hud.command_bar |
| ev.command_complete | 2단계 | action, dir, tokens_used, chars | input → sim, hud | — | cue.command_ok |
| ev.command_fail | 2단계 | reason(no_target, cooldown, blocked) | sim → hud | — | cue.command_fail, hud.fail_text |
| ev.hit / ev.kill | 2단계 | enemy_id, damage, interrupted | sim → fx, audio | — | fx.slash 등, cue.hit_* , cue.enemy_death |
| ev.move | 2단계 | from, to | sim → fx | — | cue.move, fx.move_trail |
| ev.guard_set / ev.guard_consumed | 2·5단계 | dir | sim → fx | — | fx.guard_arc, cue.guard_block |
| ev.cast_started / ev.cast_cancelled / ev.cast_warning | 4단계 | enemy_id, dir, remaining | sim → hud, audio | warning은 remaining ≤ 1.0 진입 시 1회 | ring.gauge, cue.cast_warning |
| ev.player_hit | 5단계 | enemy_id, dir, damage, reason_text | sim → hud, fx, audio | — | fx.player_hit, cue.player_hit, hud.hit_reason |
| ev.shard_dropped / ev.shard_picked | 5·7단계 | cell, xp | sim → fx, hud | — | fx.pickup_line, cue.xp_pickup |
| ev.levelup / ev.card_applied | 7단계 / 카드 확정 | level / card_id, rank | growth → screen | — | fx.levelup_beam, cue.levelup, cue.card_select |
| ev.spawn_telegraph / ev.spawned | 7단계 | cell, type | spawn → fx | — | board.spawn_marker |
| ev.boss_appear / ev.boss_telegraph / ev.boss_recovery | 4·7단계 | step | sim → hud, audio | — | cue.boss_telegraph, fx.boss_line |
| ev.run_end | 5·7단계 | result(clear/death), summary | run → screen, save | 1회 | screen.result, cue.clear / cue.death |

## 3. 로직의 기준 사례

| scenario_id | 초기 상태 | 입력 순서·시각 | 기대 최종 상태 | 기대 이벤트 순서 | 금지 결과 | 테스트 |
|---|---|---|---|---|---|---|
| S-01 동시 도착, 플레이어 우선 | 잔병 왼쪽 시전 remaining 0.05초, 플레이어 HP 5, 버퍼 "slash left" | 스텝 N에 "." 입력 | 잔병 사망, HP 5, 조각 1 | command_complete → kill → (공격 없음) | 플레이어 피격 | T-SIM-02 |
| S-02 한 글자 늦음 | 위와 같되 remaining 0.0(이번 스텝 만료) 버퍼 "slash lef" | 스텝 N에 "t" | HP 4, 버퍼 "slash left" 유지, 잔병 recovery | player_hit(reason "왼쪽 잔병, 명령 미완성(10/11자)") | 버퍼 소실 | T-SIM-03 |
| S-03 이동으로 취소 | 잔병 왼쪽 시전 중 | `m 6.` 완성 | 플레이어 (6,5), 시전 취소, 잔병 recovery 1.5초 후 재접근 | move → cast_cancelled | 피해 | T-CANCEL-01 |
| S-04 추적자 마지막 1초 | 추적자 시전 remaining 0.9초, 플레이어 인접 안 이동 | `m 6.` | 예고 칸 갱신되지 않음, 이동한 칸이 예고 밖이면 공격 빗나감, 안이면 피격 | move → attack | 예고 칸 이동 | T-CHASER-01 |
| S-05 막기 1회 | 왼쪽 막기 지속 3초, 왼쪽 잔병 2마리 같은 스텝 공격 | — | 첫 공격 막힘, 두 번째 HP −1 | guard_consumed → player_hit | 두 번 다 막힘 | T-GUARD-01 |
| S-06 미보유 축약 | A01 미보유, 버퍼 "sl left." | — | 실행 없음, 버퍼 유지, 후보 표시에 "sl: 미보유 축약" | buffer_changed(valid_prefix=false) | 자동 실행 | T-PARSE-01 |
| S-07 접두어 | A04 미보유, 버퍼 "slash up" | — | 실행 없음(up.이 필요) | — | upleft 대기 중 up 실행 | T-PARSE-02 |
| S-08 공백 생략 | A05 보유, A01 r2, A03 | "s4" | 왼쪽 베기 실행 | command_complete(chars=2) | — | T-PARSE-03 |
| S-09 사망 우선 | HP 1, 왼쪽 잔병 공격 만료, 오른쪽 잔병 조각으로 레벨업 조건 | — | phase=result(death), 레벨업 없음 | player_hit → run_end | levelup | T-DEATH-01 |
| S-10 다중 레벨업 | XP 2/3, 조각 9 XP 흡수 | — | L1→L2(잔 8)→L3(잔 4)→ 대기열 2, 카드 화면 2회 연속, 초과 4 XP 보존 | levelup×2 | 초과 XP 소실 | T-LEVEL-01 |
| S-11 회전베기 쿨다운 | A10 보유, spin 쿨다운 2초 남음 | "spin left." | 실패 표시, 쿨다운 그대로, 버퍼 비움 | command_fail(cooldown) | 쿨다운 초기화 | T-SKILL-01 |
| S-12 스폰 상한 | band 2 (max_alive 3), 살아 있는 적 3 | interval 도달 | 스폰 없음, 다음 interval에 재시도, 누적 없음 | — | 상한 초과 | T-SPAWN-01 |
| S-13 보스 등장 | t=270, 잔병 2 생존 | 잔병 처치 전 285초 도달 | 285초에 보스 등장, 잔병 유지 | boss_appear | 잔병 소멸 | T-BOSS-01 |
| S-14 보스 회복 창 | 보스 step2 공격 직후 | `thrust right.` (거리 2) | 보스 HP −1, 중단 없음, 회복 3초 유지 | hit(interrupted=false) | 회복 중단 | T-BOSS-02 |
| S-15 IME | 전투 중 한글 조합 시작 | — | 세계 정지, "영문 입력으로 전환" 안내, 조합 문자 버퍼 미반영, 영문 복귀 시 재개(유예 없음) | pause(reason=ime) | 조합 문자 실행 | T-INPUT-01 |
| S-16 재현성 | 시드 12345, 입력 시각 기록 파일 | 재생 | 동일 결과 해시 | — | 차이 | T-SIM-01 |

## 4. 콘텐츠 계획

| content_id | 종류 | 목표 경험 | 규칙 | 등장 전제 | 초기 수치 | 관련 화면·자산 | 생산 방식 | 허용 변형 | 합격 기준 |
|---|---|---|---|---|---|---|---|---|---|
| enemy.grunt | 일반 적 | 기본 명령 학습, 긴 게이지 | 고정 예고 1칸 | 0초부터 | HP 2, 피해 1, 시전 6.0 | visual.enemy.grunt.*, cue.enemy_death | 데이터 | 없음 | 첫 1분에 3~5마리 처치 가능(40 WPM 시뮬) |
| enemy.rapid | 일반 적 | 짧은 명령 필요성 | 고정 예고, 짧은 게이지 | 90초 | HP 1, 피해 1, 시전 3.0 | visual.enemy.rapid.* | 데이터 | 없음 | 찌르기 1회로 처치 가능 |
| enemy.chaser | 일반 적 | 이동만으로 못 피함 | 추적 예고, 마지막 1초 고정 | 150초 | HP 2, 피해 1, 시전 6.0 | visual.enemy.chaser.* | 데이터 | 없음 | 인접 안 이동으로 회피 불가 확인 |
| enemy.boss_executor | 보스 | 축약된 언어로 순차 예고 대응 | 삭제선 패턴 1개 | 270초 조건 | HP 14, 피해 2 | visual.boss.*, cue.boss_* | 데이터 | 없음 | 회복 창 3초에 thrust 2회 가능 |
| cards.A01~A18 (14종) | 카드 | 축약 주식·성능 반찬 | cards.json | 레벨업 | — | screen.levelup, icon.card.* | 데이터 | 없음 | 5분 안에 6~9회 제시, 첫 화면 고정 |
| arena.open_yard | 아레나 | 열린 뜰 | 11×11, 외곽 벽 | 시작 | — | tile.floor, tile.wall | 데이터 | 없음 | 모든 내부 칸 연결 |
| tutorial.hints | 힌트 | 첫 1분 학습 | 5절 | 첫 런 | — | hud.hint | 텍스트 | 문구 | 첫 레벨업까지 힌트 3개 이하 노출 |

무한·런타임 생성은 스폰 규칙(밴드·상한·난수)뿐이다. 아레나 장애물·정예·직업·해금은 MVP 밖이며 데이터 스키마에 자리만 둔다(interior_obstacles, start_skills).

## 5. 내러티브·튜토리얼

세계관은 도감 텍스트와 타이틀 한 줄로만 존재한다: "지워지는 기록의 도시에서, 기억 조각으로 자신의 전투 문장을 되찾는다." 대사·퀘스트 없음. 적의 표시 이름은 규칙 이름(잔병·속사병·추적자·기억의 집행자)을 쓴다. 외형 이름은 아트 브리프에서만 쓴다.

**튜토리얼(힌트 방식, 강제 없음)**

| step_id | 가르칠 규칙 | 시작 | 종료 | 지시문(실제 문구) | 허용·차단 입력 | 힌트 | 건너뛰기 |
|---|---|---|---|---|---|---|---|
| TUT-01 | 명령 완성으로 시작 | 런 시작 | 첫 유효 문자 | "왼쪽 적을 베려면 `slash left.` 을 입력하세요. 입력하면 시간이 흐릅니다." | 모두 허용 | 명령 예시를 명령창에 회색으로 표시 | 설정 "힌트 끄기" |
| TUT-02 | 게이지와 남은 글자 | 첫 문자 | 첫 처치 | 링 왼쪽 게이지 옆 "남은 글자 N" 강조 | — | — | 동상 |
| TUT-03 | 비켜서기 | 두 번째 적 시전 시작 | 이동 또는 처치 | "`m 6.` 으로 비켜서면 공격이 취소됩니다. 적은 남습니다." | — | — | 동상 |
| TUT-04 | 조각과 레벨업 | 첫 조각 드롭 | 첫 레벨업 | "떨어진 조각에 다가가면 경험치가 됩니다." | — | — | 동상 |
| TUT-05 | 카드 읽기 | 첫 레벨업 화면 | 선택 | "축약 카드는 명령을 짧게, 성능 카드는 수치를 올립니다. 왼쪽 두 장은 축약입니다." | 1·2·3, Enter | — | 동상 |
| TUT-06 | 축약 체감 | 첫 축약 선택 후 첫 명령 | 완성 | 명령창에 "이제 `sl left.` 8자" 표시 | — | — | 동상 |

힌트는 시간으로 지우지 않고 학습 행동 완료로 지운다. 재도전에서는 설정에 따라 표시하지 않을 수 있으며 보상 차이는 없다.

## 6. 밸런스·난이도

| parameter_id | 의미 | 단위 | 초기값 | 허용 범위 | 공식·의존 | 목표 | 변경 권한 | 회귀 테스트 |
|---|---|---|---|---|---|---|---|---|
| P-CAST-GRUNT | 잔병 기본 시전 | 초 | 6.0 | 4.0~8.0 | ×M(t) | 40 WPM이 `slash left.`(3.3초+반응 1초)를 t=0에 완성 | 개발 세션(시뮬 근거 기록) | T-DIFF-01 |
| P-CAST-RAPID | 속사병 기본 시전 | 초 | 3.0 | 2.0~4.0 | ×M(t) | 축약 1단계로 대응 가능 | 동상 | 동상 |
| P-CAST-CHASER | 추적자 | 초 | 6.0 | 4.0~8.0 | ×M(t) | — | 동상 | 동상 |
| P-DECAY | 난도 감쇠 | 배 | 0.88 | 0.85~0.92 | M(t) | 4:30에 M≈0.32 | 동상 | T-DIFF-01 |
| P-STEP | 감쇠 단계 | 초 | 30 | 20~45 | — | — | 동상 | — |
| P-FLOOR | 배율 하한 | 배 | 0.30 | 0.25~0.40 | — | 잔병 1.8초, 속사병 0.9초 | 동상 | — |
| P-XP-BASE / P-XP-INC | 레벨 비용 | XP | 3 / 1 | 2~4 / 1~2 | 3+(L−1) | 5분 6~9회 레벨업 | 동상 | T-LEVEL-02 |
| P-SPAWN-* | 밴드 간격·상한 | 초·마리 | gauge_and_spawn.json | 간격 ±1.5, 상한 ±1 | — | 처치 30~50 | 동상 | T-SPAWN-02 |
| P-GUARD-DUR | 막기 지속 | 초 | 3.0 | 2.0~4.0 | +A09 | 잔병 게이지 절반 | 동상 | T-GUARD-01 |
| P-SPIN-CD | 회전베기 쿨다운 | 초 | 4.0 | 3.0~6.0 | — | — | 동상 | T-SKILL-01 |
| P-BOSS-HP | 보스 체력 | — | 14 | 10~20 | — | 회복 창 3~4회에 처치 | 동상 | T-BOSS-03 |
| P-MOVE-INT | 적 이동 간격 | 초 | 0.8 | 0.6~1.2 | — | — | 동상 | — |

**난이도 표**

| 집단 | 요구 | 목표 | 자동 지표 | 사람 검토 | 측정 | 허용 범위 | 수정 조건 |
|---|---|---|---|---|---|---|---|
| 25 WPM | 축약 2개 이상 선택으로 3분 생존 | 3분 생존 60% | 가상 플레이어 시뮬(고정 반응 1.0초) | 시험 참가자 사망 원인 | T-SIM-BOT | 40~80% | 미달이면 P-FLOOR ↑ 또는 P-DECAY ↑ |
| 40 WPM | 클리어 가능 | 클리어 40% | 동상(반응 0.7초) | 동상 | 동상 | 25~60% | — |
| 60 WPM | 축약 없이 클리어 불가 | 축약 0개 시 4분 이전 사망 | 동상(반응 0.5초, 축약 미선택 고정) | — | 동상 | — | 축약 없이 클리어되면 P-FLOOR ↓ |

극단 점검: 이동만 반복(T-SIM-BOT-DODGE)은 3분 이내 사망해야 한다. 축약만 선택(성능 0)은 클리어 가능해야 한다. 성능만 선택(불가능: 슬롯 구조상 축약 2장 중 1장 강제 아님 → 선택은 자유이므로 성능만 고르는 봇도 시험) 시 4분 이전 사망이 정상이다. 계산 결과와 재미 검증은 다르다. 재미는 11절의 사람 시험으로만 판단한다.

## 7. 생성기·솔버

런타임 생성은 스폰(위치·종류)과 카드 후보뿐이다. 입력: 시드·밴드·상한·플레이어 위치·보유 카드. 출력: 칸·적 종류 / 카드 ID 3개. 알고리즘은 2.4절 R-SPAWN·R-OFFER와 데이터의 prng 규칙. 검사: 스폰 칸이 벽·점유·예약이 아닐 것, 카드가 선행 조건·상한·중복 규칙을 만족할 것(거절 코드 SPAWN_NO_CELL, OFFER_INELIGIBLE). 솔버 없음. 회귀 자료: 시드 1, 12345, 99999의 첫 20회 스폰과 첫 5회 카드 후보를 고정 예제로 저장(T-GEN-01).

## 8. UX와 개발·디자인 연결

| requirement | 규칙·데이터 | 화면·binding·asset | 수락·테스트 | job |
|---|---|---|---|---|
| RQ-01 초 게이지를 링에서 읽는다 | R-CAST, R-DIFFICULTY | hud.ring(8구간), ring.gauge, icon.enemy.* | T-UI-01 4방향 시전 시 순서 판독 | dev.hud_ring, design.ui_hud |
| RQ-02 명령을 타이핑해 즉시 실행 | 2.2, 2.3 | hud.command_bar, cue.type_key, cue.command_ok | T-PARSE-*, T-INPUT-01 | dev.input_parser |
| RQ-03 벗어나기·반격이 다르게 보인다 | act.move, act.slash, R-FIXED-TELEGRAPH | fx.move_trail, fx.slash, board.danger_cell | T-CANCEL-01 | dev.board_fx, design.vfx_set |
| RQ-04 레벨업마다 축약 2 + 성능 1 | R-OFFER, cards.json | screen.levelup, icon.card.* | T-OFFER-01 | dev.levelup_screen, design.ui_cards |
| RQ-05 시간이 갈수록 빨라진다 | R-DIFFICULTY, R-SPAWN | hud.clock, ring.gauge | T-DIFF-01 | dev.sim_core |
| RQ-06 피격 원인을 안다 | ev.player_hit.reason_text | hud.hit_reason, screen.result | T-UI-02 | dev.hud_feedback |
| RQ-07 보스를 축약된 언어로 넘긴다 | R-BOSS | boss.*, fx.boss_line | T-BOSS-* | dev.boss, design.boss_body |
| RQ-08 진입·일시정지·설정·결과·재시작 | UI_UX_HANDOFF 화면표 | screen.* | T-UI-03 | dev.screens, design.ui_screens |
| RQ-09 같은 시드 재현 | 2.2 | — | T-SIM-01 | dev.sim_core |
| RQ-10 IME·포커스 안전 | 2.2 정지 조건 | screen.ime_notice | T-INPUT-01 | dev.input_layer |
| RQ-11 에이전트가 시뮬로 튜닝 | 6절 파라미터 | — (헤드리스) | T-SIM-BOT | dev.sim_bot |

## 9. 첫 출시 층을 위한 데이터 확장 자리 (구현하지 않음)

- enemies.json: 항목 추가로 거병·파쇄병·술사 추가. attack_shape에 `adjacent_fan_three_fixed`, `ray_three`, `pierce_guard` 값을 예약.
- cards.json: required_class 필드 예약. 직업 전용 카드는 풀에 섞지 않는다.
- gauge_and_spawn.json: bands를 15분으로 늘리고 boss 조건을 900초로. interior_obstacles에 좌표 목록.
- player: skills_slots 2, start_skills에 직업 시작 스킬.
이 자리는 MVP 코드가 읽되 비어 있는 것으로 처리한다. 존재하지 않는 콘텐츠를 지금 명세하지 않는다.
