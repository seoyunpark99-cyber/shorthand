# 브리프: 오디오 파일럿 3큐 — audio.type_key, audio.hit_slash, audio.cast_warning

## 식별과 작업 범위
- project_id: shorthand · contract_version 1.0 · job_id: job.pilot.audio
- cue_id: audio.type_key, audio.hit_slash, audio.cast_warning (각각 독립 교체 단위)
- 사용: type_key = 문자 입력마다(끌 수 있음), hit_slash = 베기·회전베기 명중, cast_warning = 적 시전 남은 1.0초 진입 시 1회

## 제작 방식
- production_method: audio_generated · 도구: ElevenLabs Sound Effects (Starter 이상: 상업 이용·API, 확인 2026-09-17). 무료 플랜은 개인 용도만이므로 사용 금지.
- 원본: 서비스 출력(MP3 44.1k 또는 WAV) 보관 → WAV 48k 16bit mono 변환본

## 디자인 요구
| cue | 음색 | 길이 | 고유 검수 기준 |
|---|---|---|---|
| audio.type_key | 연필이 종이를 스치는 짧은 톡. 매우 작고 건조 | 0.05~0.08초 | 초당 6회 연타해도 뭉개지거나 피로하지 않음(4개 동시 재생 허용) |
| audio.hit_slash | 마른 금속 마찰 뒤 짧은 절단음 | 0.15~0.3초 | type_key와 명확히 다른 음역(더 낮고 큼) |
| audio.cast_warning | 낮은 유리를 한 번 두드린 소리, 짧은 감쇠 | 0.2~0.4초 | 효과음 사이에서 "경고"로 인지되며 반복 시 거슬리지 않음 |

## 공통 계약 규격
- 원본 WAV 48kHz 16bit mono, 런타임 OGG Vorbis q5 mono. 피크 −1 dBFS 이하, 앞 무음 0ms, 뒤 무음 ≤50ms. 볼륨 목표(dB, 믹스 기준): type_key −18, hit_slash −8, cast_warning −10.
- 파일: audio/{cue_id}.wav, audio/{cue_id}.ogg

## 만드는 지시
> (공통 음향 문단) 짧고 마른 게임 효과음. 잉크와 종이, 얇은 금속의 질감. 잔향 거의 없음, 저음 울림 없음, 배경 소음 없음. 단일 이벤트 한 번.
> - type_key: 연필심이 종이를 살짝 긁는 아주 짧은 톡 소리 하나, 0.06초.
> - hit_slash: 얇은 칼날이 마른 금속을 스치고 지나가며 짧게 끊는 소리, 0.2초.
> - cast_warning: 두꺼운 유리잔을 손톱으로 한 번 두드린 낮은 소리, 짧게 감쇠, 0.3초.

## 규격 맞추는 지시
> job.pilot.audio. 각 결과에서 앞 무음을 잘라 0ms로, 뒤 무음 50ms 이하로 정리하고, 피크를 −1 dBFS로 정규화한다. WAV 48k 16bit mono와 OGG q5를 만든다. 길이·피크·샘플레이트를 스크립트로 검사해 manifest에 기록한다. type_key는 초당 6회 연타 미리듣기 파일(1초)을 만들어 검수 결과를 적는다. 듣지 않고 합격으로 표시하지 않는다.
