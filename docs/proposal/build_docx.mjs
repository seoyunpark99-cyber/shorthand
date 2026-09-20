// SHORTHAND 스팀 출시 제안서 DOCX 생성기 — "DOCX 범용 문서 스타일 가이드" 규격 적용
// 실행: node docs/proposal/build_docx.mjs  → docs/proposal/SHORTHAND_스팀_출시_제안서.docx
import {
  AlignmentType, BorderStyle, Document, Footer, LeaderType, PageBreak, PageNumber, Packer, Paragraph, ShadingType, Table, TableCell,
  TableLayoutType, TableRow, TabStopType, TextRun, VerticalAlign, WidthType,
} from 'docx';
import { writeFileSync } from 'node:fs';

// ── 규격 (가이드 13절) ──
const F = { title: 'HY견고딕', chapter: 'HY헤드라인M', roman: '함초롬바탕', body: '휴먼명조' };
const C = { text: '222222', secondary: '666666', chapterBlue: '1F5FBF', darkBlueGray: '294A6D', pale: 'E9EEF4', mid: '9AA7B5', light: 'C2C7CD', white: 'FFFFFF' };
const font = (name) => ({ ascii: name, hAnsi: name, eastAsia: name, cs: name });
const run = (text, o = {}) => new TextRun({ text, font: font(o.font ?? F.body), size: o.size ?? 24, bold: o.bold ?? false, color: o.color ?? C.text, underline: o.underline ? {} : undefined });
const border = (color, size) => ({ style: BorderStyle.SINGLE, size, color });
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

// ── 문단 요소 ──
const pageBreak = () => new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new PageBreak()] });
const body = (text, after = 150) => new Paragraph({ spacing: { before: 0, after, line: 355 }, alignment: AlignmentType.LEFT, children: [run(text)] });
const h1 = (text, first = false) => new Paragraph({ spacing: { before: first ? 100 : 75, after: 105, line: 300 }, indent: { left: 85 }, children: [run(text, { size: 26, bold: true, underline: true })] });
const h2 = (text, first = false) => new Paragraph({ spacing: { before: first ? 160 : 400, after: 70, line: 264 }, indent: { left: 85 }, children: [run(text, { size: 23, bold: true, color: C.darkBlueGray })] });
const item1 = (text, after = 95) => new Paragraph({ spacing: { before: 20, after, line: 350 }, indent: { left: 505, hanging: 420 }, children: [run('□', { color: C.darkBlueGray }), run(`  ${text}`)] });
const item2 = (text, after = 95) => new Paragraph({ spacing: { before: 0, after, line: 322 }, indent: { left: 565, hanging: 230 }, children: [run('○', { size: 20, color: C.mid }), run(`  ${text}`, { size: 21, color: C.secondary })] });
const notice = (text) => new Paragraph({ spacing: { before: 100, after: 100, line: 276 }, indent: { left: 85, right: 85 }, children: [run(`※ ${text}`, { size: 19, color: C.secondary })] });
const caption = (text) => new Paragraph({ spacing: { before: 120, after: 60, line: 255 }, children: [run(text, { size: 20, bold: true })] });
const blank = () => new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [] });

// ── 장 제목 표 (6.6절) ──
function chapter(roman, title) {
  const left = new TableCell({
    width: { size: 482, type: WidthType.DXA },
    borders: { top: border(C.chapterBlue, 8), left: border(C.chapterBlue, 8), bottom: border(C.chapterBlue, 8), right: border(C.chapterBlue, 8) },
    shading: { fill: C.chapterBlue, type: ShadingType.CLEAR, color: 'auto' },
    margins: { top: 55, bottom: 55, left: 35, right: 35 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { line: 240 }, alignment: AlignmentType.CENTER, children: [run(roman, { font: F.roman, size: 28, bold: true, color: C.white })] })],
  });
  const right = new TableCell({
    width: { size: 8929, type: WidthType.DXA },
    borders: { top: NONE, left: NONE, right: NONE, bottom: border(C.darkBlueGray, 8) },
    margins: { top: 75, bottom: 75, left: 135, right: 65 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { line: 264 }, children: [run(title, { font: F.chapter, size: 30, bold: true })] })],
  });
  return new Table({ layout: TableLayoutType.FIXED, alignment: AlignmentType.LEFT, width: { size: 9411, type: WidthType.DXA }, columnWidths: [482, 8929], rows: [new TableRow({ cantSplit: true, children: [left, right] })] });
}

// ── 일반 정보표 (8.2절) ──
function table(widths, header, rows, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== 9638) throw new Error(`table width ${total} != 9638`);
  const centerCols = new Set(opts.center ?? []);
  const hCell = (t, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    borders: { top: border(C.darkBlueGray, 7), bottom: border(C.mid, 4), left: border(C.light, 2), right: border(C.light, 2) },
    shading: { fill: C.pale, type: ShadingType.CLEAR, color: 'auto' },
    margins: { top: 75, bottom: 75, left: 70, right: 70 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { line: 264 }, alignment: AlignmentType.CENTER, children: [run(t, { size: 19, bold: true })] })],
  });
  const bCell = (t, i) => {
    const isCat = i === 0 && opts.category;
    const lines = Array.isArray(t) ? t : [t];
    return new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      borders: { top: NONE, bottom: border(C.light, 2), left: border(C.light, 2), right: border(C.light, 2) },
      shading: isCat ? { fill: C.pale, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: { top: 66, bottom: 66, left: 75, right: 75 },
      verticalAlign: VerticalAlign.CENTER,
      children: lines.map((ln) => new Paragraph({ spacing: { line: 264 }, alignment: isCat || centerCols.has(i) ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(ln, { size: 19, bold: isCat })] })),
    });
  };
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 9638, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ cantSplit: true, tableHeader: true, children: header.map(hCell) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map(bCell) })),
    ],
  });
}

// ── 표지·목차 ──
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 3050, after: 155, line: 420 }, children: [run('SHORTHAND 스팀 출시 제안서', { font: F.title, size: 36, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 5200, line: 420 }, children: [run('타이핑 액션 로그라이트 MVP의 상용 출시 계획', { font: F.title, size: 36, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 300 }, children: [run('히비스튜디오', { size: 22, color: C.secondary })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 0, line: 300 }, children: [run('2026. 9. 20.', { size: 22, color: C.secondary })] }),
  pageBreak(),
];
const TOC = [
  ['I. 문서 개요', '3'], ['II. 출시 준비', '4'], ['III. 스팀 노출 구조와 마케팅', '6'], ['IV. 행정 절차', '8'], ['V. 수익 구조와 목표', '9'], ['VI. 확장 계획과 리스크', '11'], ['VII. 출처', '12'],
];
const toc = [
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.darkBlueGray, space: 0 } }, spacing: { before: 380, after: 520, line: 380 }, children: [run('목 차', { font: F.chapter, size: 34, bold: true })] }),
  ...TOC.map(([t, p]) => new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026, leader: LeaderType.DOT }], spacing: { before: 0, after: 235, line: 330 }, children: [run(t, { size: 25, bold: true }), new TextRun({ text: '\t', font: font(F.body) }), run(p, { size: 24, color: C.secondary })] })),
  pageBreak(),
];

// ── 본문 ──
const ch1 = [
  chapter('I', '문서 개요'),
  h1('1. 제안 요지', true),
  body('히비스튜디오는 타이핑 액션 로그라이트 SHORTHAND(속기)의 MVP를 완성해 웹에 배포했으며, 1주일 안에 상용 품질로 다듬어 스팀에 9,900원 유료 타이틀로 출시하고자 함.'),
  body('스팀은 출시 직후 짧은 노출 기회를 주고, 그 안의 판매 속도가 이후 추천 노출을 결정함. 따라서 출시 전에 위시리스트를 모으는 광고를 먼저 집행하고, 출시 시점에 그 위시리스트를 매출로 전환하는 순서로 진행함.'),
  body('기획 산출물이 명세, 데이터, 에셋 계약, 브리프로 표준화되어 있어 같은 제작 절차로 후속 타이틀을 연속 제작할 수 있음.'),
  h1('2. MVP 완성 현황'),
  body('기획서(spec 1.0 / contract 1.0)의 MVP 범위를 전부 구현해 배포했고, 기획의 시나리오 16개가 자동 테스트로 통과함.'),
  caption('표 1. MVP 현황'),
  table([1900, 7738], ['항목', '내용'], [
    ['게임', '8방향 격자에서 적의 공격 게이지가 차기 전에 명령을 타이핑해 베거나 비켜서는 실시간 타이핑 액션 로그라이트. 레벨업마다 명령어를 축약해 같은 손으로 더 빨리 살아남는 성장 구조'],
    ['플레이 링크', 'https://shorthand-blue.vercel.app (Vercel 프로덕션)'],
    ['플레이 영상', '녹화본 별도 첨부'],
    ['구현 범위', '8화면 전부, 적 3종과 보스 1패턴, 카드 14종, 50ms 고정 스텝 시뮬레이션, 시드 재현, 가상 플레이어 시뮬레이션'],
    ['에셋', '벡터 파일럿 38장(몸체 5종, 타일 3, 조각, 카드 패널 2, 아이콘 17) 적용. 효과음 16큐는 임시'],
    ['검증', '유닛 테스트 34건 통과, 자동 완주 테스트(타이틀부터 결과·기록까지) 통과'],
  ], { category: true }),
  pageBreak(),
];

const ch2 = [
  chapter('II', '출시 준비'),
  h1('1. 개선 계획 (1주일)', true),
  body('게임 규칙은 그대로 두고 상용 판매에 필요한 네 가지를 일주일에 끝냄. 그림체, 소리, 연출, Windows 실행 파일임. 모든 에셋은 이미 구현된 교체 경로로 들어가므로 코드 수정 없이 바뀜.'),
  caption('표 2. 일별 작업'),
  table([600, 5238, 2000, 1800], ['일', '작업', '산출물', '도구·비용'], [
    ['1', '기준 그림 2~3안 생성 후 화풍 확정. Steam Direct 수수료 결제', '기준 그림 승인본', 'gpt-image API'],
    ['2', '몸체 5종을 승인 화풍으로 재생성, 캔버스·피벗 후처리, 임포트', '래스터 몸체 15프레임', '위와 동일'],
    ['3', '효과음 16큐 생성·정규화(48kHz, 피크 −1dB)', 'audio 16개', 'ElevenLabs Starter'],
    ['4', '연출 보강: 베기 궤적, 피격 파편, 사망 붕괴, 경고 펄스, 레벨업 광선', '코드 모션', '없음'],
    ['5', 'Electron 패키징(Windows x64), 키보드·한글 IME 실기기 확인', 'SHORTHAND.exe', 'electron-builder'],
    ['6', '밸런스: 봇 시뮬레이션과 지인 5명 시험 후 게이지·스폰 값 확정', '파라미터 확정', '없음'],
    ['7', '스토어 소재: 캡슐 이미지 6종, 트레일러 30~60초, 스크린샷 5장, 설명문 한·영', '스토어 페이지 제출', '없음'],
  ], { center: [0] }),
  notice('콘텐츠 분량(5분 런, 적 3종과 보스 1)은 이번 일주일에 늘리지 않음. 분량 지적이 나오면 첫 업데이트로 15분 런을 추가함(VI장 리스크 참조).'),
  pageBreak(),
  h1('2. 스팀 등록 절차와 출시 일정', true),
  body('스팀 규정상 수수료 결제 후 30일이 지나야 출시할 수 있고, 스토어 페이지는 출시 전 2주 이상 공개돼 있어야 함. 따라서 가장 빠른 출시일은 수수료 결제일 기준 5~6주 뒤이며, 그 사이가 광고 기간임. 수수료는 개발이 완료되는 대로 결제함.'),
  item1('파트너 가입(계약·NDA) → 수수료 $100 결제(30일 대기 시작) → 신원·세금 검증 2~7영업일 → Coming Soon 페이지 검수 1~5일 → 페이지 공개 2주 이상 → 빌드 검수 1~5일 → 출시'),
  item2('수수료 $100은 환불되지 않으나 조정 총매출 $1,000 달성 시 정산금에서 회수됨.'),
  item2('정산은 판매 익월 30일까지 USD 송금, 최소 지급액 $100, 중개은행 수수료는 수령자 부담임.'),
  caption('표 3. 주별 일정'),
  table([900, 1900, 6838], ['주', '기간', '내용'], [
    ['1', '9/22~9/28', '제작 마무리, 스팀 수수료 결제와 세금 인터뷰, 게임제작업 등록 접수, 등급분류 신청'],
    ['2', '9/29~10/5', 'Coming Soon 페이지 제출·공개, 데모 빌드 업로드, 커뮤니티·쇼트폼 시작'],
    ['3~4', '10/6~10/19', '유료 광고 집행, 스트리머 키 배포, 등급분류 증서 수령'],
    ['5', '10/20~10/26', '출시 빌드 검수 제출, 위시리스트 마지막 홍보'],
    ['6', '10/27~11/2', '출시(수수료 결제 30일 경과 후), 출시 할인 10% 1주'],
  ], { center: [0, 1] }),
  pageBreak(),
];

const ch3 = [
  chapter('III', '스팀 노출 구조와 마케팅'),
  h1('1. 스팀 노출 구조', true),
  body('"출시 후 3일 노출"은 반만 맞음. 스팀은 신작에게 기회를 주지만, 그 기회가 이어지는 시간은 출시 후 24~48시간의 판매 속도가 정함. 약한 출시는 반나절 만에 묻히고, 강한 출시는 5~7일까지 감. 출시 전 위시리스트가 전부인 이유임. 출시일에 위시리스트 알림 메일이 나가고, 그 전환이 판매 속도를 만들고, 그 속도가 알고리즘 노출을 만듦.'),
  caption('표 4. 노출 위젯별 기준'),
  table([2200, 3738, 3700], ['노출 위젯', '기준', '우리에게 의미'], [
    ['Popular Upcoming (출시 전)', '출시 시점 위시리스트 수 순위. 통상 7,000~10,000개가 진입선', '사전 광고의 1차 목표'],
    ['New & Trending (출시 직후)', '국가·언어별 매출 문턱. 트래픽·페이지뷰는 무시', '출시 할인과 한글·영어 동시 지원으로 문턱 둘 다 노림'],
    ['Discovery Queue', '짧은 기간의 위시리스트 증가 속도', '광고 집행을 출시 직전 2주에 모음'],
    ['Featured & Recommended', '매출 규모와 태그 매칭', '첫 타이틀에서는 기대하지 않음'],
  ], { category: true }),
  body('출시 시점 위시리스트 대비 첫 주 판매량의 중간값은 0.15배(25,000개 이상 표본, $10 초과 가격은 0.10배)임. 첫 주 판매 2,000장을 원하면 위시리스트 약 13,000개가 필요함. 상위 전환 게임은 출시 7일 후 리뷰 긍정 91%, 하위는 67%였음. 출시 실패를 기억하는 불이익은 없어서 나중에 판매가 튀면 그때 다시 노출됨.', 120),
  body('2025년 스팀 신작은 20,282개, 리뷰 1,000개를 넘긴 게임은 608개(3.0%)임. 리뷰 10개 미만으로 끝난 게임이 절반임.'),
  h1('2. 사전 광고·마케팅 계획'),
  body('목표는 출시일 위시리스트 10,000개, 예산 100만원, 기간은 스토어 페이지 공개 후 4주임. 예산을 100만원으로 두는 이유는 세 가지임. 위시리스트를 가장 많이 모으는 채널(스팀 데모, Next Fest, 쇼트폼, 커뮤니티)은 비용이 0임. 유료 광고는 위시리스트 1개당 비용이 검증되지 않았으므로 먼저 소액으로 단가를 재고 맞으면 다음 타이틀에서 늘림. 고정비를 200만원 안에 묶어야 손익분기가 400장 아래로 내려와 첫 타이틀의 실패 비용이 작음.'),
  caption('표 5. 채널별 계획'),
  table([2100, 4238, 1400, 1900], ['채널', '방법', '예산(원)', '기대 위시리스트'], [
    ['스팀 데모 + Next Fest', 'MVP를 그대로 무료 데모로 등록. 가장 가까운 Next Fest 일정에 맞추면 유입이 가장 큼', '0', '3,000~5,000'],
    ['쇼트폼', '"타이핑으로 싸운다"는 15초 클립 20개. 손이 보이는 키보드 캠과 화면', '0', '2,000~4,000'],
    ['유료 광고 (Meta·YouTube)', '타이핑 게임·로그라이트 관심사 타깃. 처음 1주 30만원으로 위시리스트 단가를 재고, 맞을 때만 나머지 집행', '700,000', '700~1,500'],
    ['한국 커뮤니티', '루리웹, 디시 인디게임 갤러리, 스팀 커뮤니티 한국 포럼에 개발 과정 글', '0', '500~1,000'],
    ['스트리머·유튜버 키 배포', '타이핑·로그라이트 중소 채널 30곳에 키와 보도자료', '0', '500~2,000'],
    ['보도자료', '인디게임 매체 한·영 20곳', '0', '300~1,000'],
    ['예비', '트레일러 외주 또는 광고 증액', '300,000', '—'],
  ], { category: true, center: [2, 3] }),
  item1('KPI는 주간 위시리스트 순증가와 채널별 스토어 페이지 방문 대비 위시리스트 전환율(UTM 링크로 구분)임.'),
  item1('유료 광고는 위시리스트 1개당 비용이 1,000원을 넘으면 중단함. 위시리스트 1개의 1년 기대 매출이 실수령 기준 약 1,700원임.'),
  item1('출시 주에는 출시 할인 10%, 전 채널 동시 게시, 첫 48시간 리뷰 요청 문구 표시, 버그 핫픽스 24시간 안 대응을 실행함.', 0),
  pageBreak(),
];

const ch4 = [
  chapter('IV', '행정 절차'),
  body('사업자(히비스튜디오)는 있으므로 남은 행정은 게임제작업 등록과 등급분류 둘임. 게임제작업 등록은 구청 접수로 며칠 안에 끝남. 등급분류는 스팀이 국내 자체등급분류사업자가 아니라서 개발사가 직접 받아야 하며, 이 비용이 출시 고정비 중 가장 큼.'),
  caption('표 6. 행정 항목'),
  table([1700, 4238, 1500, 1200, 1000], ['항목', '기관·근거', '비용(원)', '기간', '상태'], [
    ['사업자 등록', '히비스튜디오', '—', '—', '완료'],
    ['게임제작업 등록', '게임산업진흥법 제25조. 영업소 소재 구청. 서류: 신청서, 임대차계약서 사본, 제작시설·장비 명세서', '수수료 20,000 + 등록면허세 40,500', '법정 3일', '이번 주'],
    ['등급분류', '게임콘텐츠등급분류위원회(전체이용가~15세). PC 기초가액 360,000 × 비네트워크 1.0 × 액션 2.0 × 한글 1.0', '720,000', '10~15일', '빌드 확정 직후'],
    ['미국 원천징수', 'Steamworks 세금 인터뷰에서 W-8BEN, 사업자번호를 외국 TIN으로 제출. 한미 조세조약으로 30% → 10%', '0', '2~7영업일', '스팀 가입 시'],
  ], { category: true, center: [2, 3, 4] }),
  notice('등급분류는 스팀이 요구하는 것이 아니라 국내법이 요구함. 밸브의 자체등급분류사업자 지정은 검토 단계 보도(2024년)만 있고 지정된 적이 없음. 상업 판매이므로 비영리 수수료 면제 대상이 아님.'),
  pageBreak(),
];

const ch5 = [
  chapter('V', '수익 구조와 목표'),
  h1('1. 장당 실수령', true),
  body('9,900원짜리 한 장을 팔면 손에 들어오는 돈은 약 5,670원(57%)임. 한국 가격에는 부가세 10%가 포함돼 있고, 밸브가 이를 떼고 남은 금액의 30%를 가져간 뒤 미국 원천징수 10%를 떼고 송금함.'),
  caption('표 7. 장당 계산'),
  table([3000, 3638, 3000], ['단계', '계산', '금액(원)'], [
    ['판매가', '스토어 표시 가격', '9,900'],
    ['부가세 제외', '9,900 ÷ 1.1', '9,000'],
    ['밸브 30% 제외', '9,000 × 0.7', '6,300'],
    ['미국 원천징수 10% 제외', '6,300 × 0.9', '5,670'],
    ['환불 반영(가정 8%)', '장당 기대값', '약 5,220'],
  ], { category: true, center: [2] }),
  item2('원천징수 10%는 종합소득세 신고 시 외국납부세액공제로 돌려받을 수 있으므로 실질 손실은 아님(세무사 확인 필요). 한국 소득세는 연말 별도임.'),
  h1('2. 출시 고정비와 손익분기'),
  caption('표 8. 출시 고정비'),
  table([6638, 3000], ['항목', '금액(원)'], [
    ['등급분류 심의', '720,000'],
    ['Steam Direct $100 (회수 전 기준, 환율 1,400)', '140,000'],
    ['게임제작업 등록', '60,500'],
    ['에셋 생성(gpt-image, ElevenLabs 1개월)', '50,000'],
    ['광고·마케팅', '1,000,000'],
    ['합계', '1,970,500'],
  ], { center: [1] }),
  body('손익분기는 1,970,500 ÷ 5,220 = 약 380장임. 광고를 빼면 186장임. Steam Direct 수수료는 조정 총매출 $1,000(약 160장)에서 회수됨. 인건비(기획·개발 1인)는 반영하지 않음.'),
  pageBreak(),
  h1('3. 목표와 시나리오', true),
  body('목표는 출시 3개월 누적 3,000장, 실수령 1,566만원, 고정비 차감 순이익 1,369만원(마진 87%)임. 하한은 3개월 안에 손익분기 380장을 넘기는 것임. 목표는 위시리스트 10,000개가 중간값 0.15배로 첫 주 1,500장, 이후 두 달에 같은 양이 더 팔리는 가정임.'),
  caption('표 9. 시나리오'),
  table([1800, 3238, 1500, 1600, 1500], ['시나리오', '전제', '3개월 판매(장)', '실수령(만원)', '순이익(만원)'], [
    ['하한(손익분기)', '위시리스트 2,500, 전환 0.15배', '380', '198', '0'],
    ['목표', '위시리스트 10,000, 전환 0.15배', '3,000', '1,566', '1,369'],
    ['상한', '위시리스트 25,000, 쇼트폼 1개 바이럴', '10,000', '5,220', '5,023'],
  ], { category: true, center: [2, 3, 4] }),
  item1('하한은 위시리스트 2,500개만 모으면 도달함. 무료 채널만으로도 닿는 수치임.'),
  item1('목표 시나리오의 순이익 1,369만원은 다음 타이틀의 출시 고정비(약 200만원)를 여섯 번 넘게 대는 금액임.'),
  item1('수익 확인 시점은 출시 후 48시간(노출 유지 여부), 1주(위시리스트 전환 배수), 1개월(첫 정산), 3개월(목표 판정)임.', 0),
  pageBreak(),
];

const ch6 = [
  chapter('VI', '확장 계획과 리스크'),
  h1('1. 벌크 제작 파이프라인', true),
  body('이 타이틀은 제작 절차의 검증이기도 함. 기획이 명세·데이터·에셋 계약·브리프로 표준화되어 있어서, 코딩 에이전트가 기획서만 받아 MVP를 만들고 벡터 에셋까지 직접 뽑았음. 사람이 하는 일은 기획, 화풍 승인, 플레이 판정, 마케팅임.'),
  caption('표 10. 단계별 소요'),
  table([4200, 2138, 1600, 1700], ['단계', '담당', '이번 타이틀', '다음부터'], [
    ['0차 기획 → 상세 기획(명세, 데이터 4, 에셋 계약, 브리프 12)', '기획자 + 기획 에이전트', '완료', '1주'],
    ['MVP 구현(시뮬레이션, 화면, 테스트, 봇, 배포)', '코딩 에이전트', '1일', '1~2일'],
    ['벡터 에셋 + 임포트 파이프라인', '코딩 에이전트', '1일', '재사용'],
    ['래스터 화풍, 효과음, 연출, 패키징', '생성 도구 + 에이전트', '이번 주', '3~4일'],
    ['스팀 등록, 등급분류, 광고', '기획자', '이번 주부터', '병렬'],
  ], { center: [2, 3] }),
  body('스팀의 30일 대기가 병목이므로 타이틀을 격주로 등록해 두면 한 달에 두 타이틀을 낼 수 있음. 다음 타이틀 후보는 SHORTHAND의 첫 출시 확장판(15분 런, 적 6종, 직업 3종. 기획서에 데이터 자리가 있음)과 같은 엔진을 쓰는 타이핑 장르 변주임.'),
  h1('2. 리스크와 대응'),
  caption('표 11. 리스크'),
  table([2600, 2200, 4838], ['리스크', '영향', '대응'], [
    ['5분 런 분량이 9,900원에 부족하다는 리뷰', '환불·부정 리뷰로 노출 이탈', '스토어 설명에 한 판 5분·반복 플레이를 명시하고 데모로 미리 경험시킴. 분량 지적이 나오면 첫 업데이트로 15분 런을 무료 추가. 대안은 6,600원 책정 후 확장판에서 인상'],
    ['위시리스트 3,000개 미만으로 출시', '출시 노출 반나절', '출시를 2~4주 미루고 Next Fest에 데모 출품. 연기에 불이익 없음'],
    ['한글 IME 전환 문제', '국내 이용자 첫인상', '감지·정지를 구현함. 출시 전 실기기 3대에서 확인'],
    ['타이핑 속도 격차', '25 WPM 이하는 3분 생존 어려움', '난이도 옵션(게이지 배율)은 데이터 파일 1줄. 설정에 "느린 적" 토글'],
    ['등급분류 지연', '출시 밀림', '스팀 30일 대기와 병렬로 첫 주에 신청'],
    ['수익 목표 미달', '다음 타이틀 자금', '고정비를 200만원 안으로 묶어 손익분기 380장. 두 번째 타이틀의 광고비는 첫 타이틀 수익 안에서만 집행'],
  ], { category: true }),
  pageBreak(),
];

const SOURCES = [
  ['Steamworks: Steam Direct Fee', 'partner.steamgames.com/doc/gettingstarted/appfee', '$100, 환불 불가, $1,000 달성 시 회수'],
  ['Steamworks: Onboarding', 'partner.steamgames.com/doc/gettingstarted/onboarding', '30일 대기, Coming Soon 2주, 검수 1~5일'],
  ['Steamworks: Taxes FAQ', 'partner.steamgames.com/doc/finance/taxfaq', '순매출 산정, 원천징수, W-8BEN'],
  ['Steamworks: Reporting and Payments FAQ', 'partner.steamgames.com/doc/finance/payments_salesreporting/faq', '익월 30일 정산, 최소 $100'],
  ['GameDiscoverCo (2025-10-17)', 'newsletter.gamediscover.co/p/the-state-of-steam-wishlist-conversions', '위시리스트 전환 중간 0.15배'],
  ['How To Market A Game', 'howtomarketagame.com/2023/09/04/killing-the-myths-behind-steams-visibility', '노출 위젯 기준'],
  ['VoxBooster: Indie Game Statistics 2026', 'voxbooster.com/blog/indie-game-statistics-2026', '2025년 신작 20,282개'],
  ['게임메카: 스팀에 게임을 출시하고 싶다면?', 'gamemeca.com/view.php?gid=1751893', '한국 개발자 절차, 원천징수 10%'],
  ['게임콘텐츠등급분류위원회 수수료 산정', 'gcrb.or.kr', 'PC 기초가액 360,000원 × 계수'],
  ['정부24: 게임제작(배급)업 등록', 'gov.kr', '서류·근거법령'],
  ['디스이즈게임: 밸브의 스팀, 자체등급분류사업자 등록에 관심', 'thisisgame.com/articles/191093', '지정 미확정'],
];
const appendix = [
  chapter('VII', '출처'),
  caption('표 12. 참고 자료'),
  table([3300, 4238, 2100], ['자료', '주소', '인용 내용'], SOURCES, {}),
  notice('광고 단가, 환불율 8%, 시나리오 판매량은 가정이며 본문에 그렇게 표시함.'),
];

const footer = new Footer({
  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 240 }, children: [
    new TextRun({ children: [PageNumber.CURRENT], font: font(F.body), size: 19, color: C.secondary }),
    new TextRun({ text: ' / ', font: font(F.body), size: 19, color: C.secondary }),
    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: font(F.body), size: 19, color: C.secondary }),
  ] })],
});

const doc = new Document({
  creator: '히비스튜디오',
  title: 'SHORTHAND 스팀 출시 제안서',
  styles: {
    default: { document: { run: { font: font(F.body), size: 24, color: C.text }, paragraph: { spacing: { line: 348, after: 0 } } } },
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, right: 1134, bottom: 1020, left: 1134, header: 0, footer: 454, gutter: 0 } } },
    footers: { default: footer },
    children: [...cover, ...toc, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...appendix],
  }],
});

const out = new URL('./SHORTHAND_스팀_출시_제안서.docx', import.meta.url);
writeFileSync(out, await Packer.toBuffer(doc));
console.log('written', out.pathname);
void blank;
