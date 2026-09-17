# 도구 조사 스냅숏 (조사일 2026-09-17, shorthand 프로젝트에서 갱신)

**이 문서는 결정 근거가 아니다.** 다음 기획의 출발점이다. 결정 시점에 다시 확인한다. 신뢰도: 공식 / 보도 / 미확인.

## 1. 2D 이미지 생성

| 도구 | 확인된 특징 | 계약에 주는 영향 | 신뢰도 |
|---|---|---|---|
| OpenAI gpt-image-2.5-sunburst / flare | 투명 배경 정식 지원(2 계열은 미리보기), 임의 해상도 WIDTHxHEIGHT(16 배수, 최대 3840×2160, 비율 1:3~3:1), png/jpeg/webp, 품질 low~max, API 사용에 조직 인증 | 원본 PNG. 투명 직접 요청 가능. 글자 불가 | 공식 (2026-09-17) |
| Ludo.ai | Indie $20/월(API 없음, 3,000 크레딧/년), Pro $50/월(API·MCP, 12,000), Studio $300. 스프라이트 시트·투명 지원. 상업 이용 조건 가격 페이지에 명시 없음 | 상업 조건 약관 확인 필요 | 공식 가격 페이지 (2026-09-17) |
| PixelLab, SpriteCook, Scenario, Layer.ai, Leonardo | 이번 조사 안 함 | — | 미확인(이전 스냅숏 참조) |

## 2. 벡터·글꼴
- 코딩 에이전트가 SVG 직접 작성 후 resvg/Inkscape CLI로 래스터화: 이 프로젝트가 채택. 도구 설치 가능 여부는 디자인 세션이 확인 (미확인).
- JetBrains Mono, Pretendard: SIL OFL 1.1로 알려짐. 원문 확인은 납품 시 (미확인).

## 3. 오디오
| 도구 | 확인된 특징 | 신뢰도 |
|---|---|---|
| ElevenLabs Sound Effects | 무료 10k 크레딧/월·개인 용도만·API 없음. Starter $6/월부터 상업 이용·API. 최대 30초. 무료/Starter MP3 44.1k, Creator/Pro WAV 48k. 권리는 해지 후에도 유지 | 공식 (2026-09-17) |

## 4. 개발 스택
| 항목 | 확인된 사실 | 신뢰도 |
|---|---|---|
| Godot | 4.7.2 stable (2026-08-18), 4.8 dev 진행. 텍스트 씬, 명령줄 헤드리스·내보내기 | 공식 releases (2026-09-17) |
| Phaser | 4.2.1 (2026-07-09). 4.0 정식 2026-04-10, WebGL 렌더러 재작성. Phaser+Electron 공식 템플릿 | 공식 releases·뉴스 (2026-09-17) |
| Claude Code + Godot | GDScript 편집 실용적, 게임 실행·런타임 오류 확인 불가, MCP로 보완 가능 | 보도 (summerengine.com) |

## 5. 다음 조사 때 우선 확인
- gpt-image-2.5 가격과 일일 한도, 투명 배경 품질(잉크 실루엣 외곽).
- ElevenLabs 약관의 플랜별 권리 조항 원문.
- Phaser 4의 한글 Text 렌더 품질, Electron vs Tauri IME 동작.
- SVG 래스터화 도구(resvg) 설치 가능 환경.
