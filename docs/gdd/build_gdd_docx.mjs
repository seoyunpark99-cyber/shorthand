// SHORTHAND 게임 기획서(통합본) DOCX 생성기 — "DOCX 범용 문서 스타일 가이드" 규격
// 실행: node docs/gdd/build_gdd_docx.mjs → docs/gdd/SHORTHAND_게임_기획서.docx
import {
  AlignmentType, BorderStyle, Document, Footer, LeaderType, PageBreak, PageNumber, Packer, Paragraph, ShadingType, Table, TableCell,
  TableLayoutType, TableRow, TabStopType, TextRun, VerticalAlign, WidthType,
} from 'docx';
import { writeFileSync } from 'node:fs';

const F = { title: 'HY견고딕', chapter: 'HY헤드라인M', roman: '함초롬바탕', body: '휴먼명조' };
const C = { text: '222222', secondary: '666666', chapterBlue: '1F5FBF', darkBlueGray: '294A6D', pale: 'E9EEF4', mid: '9AA7B5', light: 'C2C7CD', white: 'FFFFFF' };
const font = (name) => ({ ascii: name, hAnsi: name, eastAsia: name, cs: name });
const run = (text, o = {}) => new TextRun({ text, font: font(o.font ?? F.body), size: o.size ?? 24, bold: o.bold ?? false, color: o.color ?? C.text, underline: o.underline ? {} : undefined });
const border = (color, size) => ({ style: BorderStyle.SINGLE, size, color });
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

const pageBreak = () => new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new PageBreak()] });
const body = (text, after = 150) => new Paragraph({ spacing: { before: 0, after, line: 355 }, alignment: AlignmentType.LEFT, children: [run(text)] });
const h1 = (text, first = false) => new Paragraph({ spacing: { before: first ? 100 : 75, after: 105, line: 300 }, indent: { left: 85 }, children: [run(text, { size: 26, bold: true, underline: true })] });
const h2 = (text, first = false) => new Paragraph({ spacing: { before: first ? 160 : 400, after: 70, line: 264 }, indent: { left: 85 }, children: [run(text, { size: 23, bold: true, color: C.darkBlueGray })] });
const item1 = (text, after = 95) => new Paragraph({ spacing: { before: 20, after, line: 350 }, indent: { left: 505, hanging: 420 }, children: [run('□', { color: C.darkBlueGray }), run(`  ${text}`)] });
const item2 = (text, after = 95) => new Paragraph({ spacing: { before: 0, after, line: 322 }, indent: { left: 565, hanging: 230 }, children: [run('○', { size: 20, color: C.mid }), run(`  ${text}`, { size: 21, color: C.secondary })] });
const notice = (text) => new Paragraph({ spacing: { before: 100, after: 100, line: 276 }, indent: { left: 85, right: 85 }, children: [run(`※ ${text}`, { size: 19, color: C.secondary })] });
const caption = (text) => new Paragraph({ spacing: { before: 120, after: 60, line: 255 }, children: [run(text, { size: 20, bold: true })] });

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

let tableNo = 0;
function table(widths, header, rows, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== 9638) throw new Error(`table width ${total} != 9638 (${header.join('/')})`);
  const centerCols = new Set(opts.center ?? []);
  const size = opts.size ?? 19;
  const hCell = (t, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    borders: { top: border(C.darkBlueGray, 7), bottom: border(C.mid, 4), left: border(C.light, 2), right: border(C.light, 2) },
    shading: { fill: C.pale, type: ShadingType.CLEAR, color: 'auto' },
    margins: { top: 75, bottom: 75, left: 70, right: 70 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { line: 264 }, alignment: AlignmentType.CENTER, children: [run(t, { size, bold: true })] })],
  });
  const bCell = (t, i) => {
    const isCat = i === 0 && opts.category;
    return new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      borders: { top: NONE, bottom: border(C.light, 2), left: border(C.light, 2), right: border(C.light, 2) },
      shading: isCat ? { fill: C.pale, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      margins: { top: 66, bottom: 66, left: 75, right: 75 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ spacing: { line: 264 }, alignment: isCat || centerCols.has(i) ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(String(t), { size, bold: isCat })] })],
    });
  };
  return new Table({
    layout: TableLayoutType.FIXED, width: { size: 9638, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ cantSplit: true, tableHeader: true, children: header.map(hCell) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map(bCell) }))],
  });
}
const cap = (t) => caption(`표 ${++tableNo}. ${t}`);

// ───────────── 표지·목차 ─────────────
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 3050, after: 155, line: 420 }, children: [run('SHORTHAND 게임 기획서', { font: F.title, size: 36, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 5200, line: 420 }, children: [run('MVP 통합본 (spec 1.0, CR-01·02·05 반영)', { font: F.title, size: 36, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 300 }, children: [run('히비스튜디오', { size: 22, color: C.secondary })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 0, line: 300 }, children: [run('2026. 9. 22.', { size: 22, color: C.secondary })] }),
  pageBreak(),
];
const TOC = [
  ['I. 개요', '3'], ['II. 핵심 루프와 대표 플레이', '4'], ['III. 기본 규칙', '5'], ['IV. 적과 보스', '7'], ['V. 성장', '9'],
  ['VI. 스폰과 난이도', '10'], ['VII. 튜토리얼과 화면', '12'], ['VIII. 밸런스 목표', '14'], ['IX. 로직 기준 사례', '15'], ['X. 첫 출시 확장 층', '16'], ['XI. 결정과 변경 이력', '17'],
];
const toc = [
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.darkBlueGray, space: 0 } }, spacing: { before: 380, after: 520, line: 380 }, children: [run('목 차', { font: F.chapter, size: 34, bold: true })] }),
  ...TOC.map(([t, p]) => new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026, leader: LeaderType.DOT }], spacing: { before: 0, after: 235, line: 330 }, children: [run(t, { size: 25, bold: true }), new TextRun({ text: '\t', font: font(F.body) }), run(p, { size: 24, color: C.secondary })] })),
  pageBreak(),
];

// ───────────── I. 개요 ─────────────
const ch1 = [
  chapter('Ⅰ', '개요'),
  body('SHORTHAND(속기)는 8방향 격자 한가운데서, 초 단위로 차오르는 적의 공격 게이지를 보고 명령을 타이핑해 비켜서거나 되받아치는 실시간 타이핑 액션 로그라이트임. 시간이 갈수록 적은 빨라지고, 레벨업마다 명령어를 축약해 같은 손으로 더 많이 살아남음.'),
  body('검증 질문은 하나임. "적이 빨라지는 속도와 내 명령이 짧아지는 속도가 맞붙을 때, 살아남는 것이 재미있는가." 이 문서의 범위는 MVP(5분 압축판과 보스 1패턴)이며, 적·카드·스폰·보스는 데이터로 정의해 첫 출시 층(X장)이 코드 구조 변경 없이 붙음.'),
  cap('제품 정의'),
  table([2000, 7638], ['항목', '값'], [
    ['타깃', '타이핑 게임의 손맛과 서바이버류의 성장 쾌감을 아는 PC 플레이어'],
    ['핵심 재미·선택', '게이지 안에 명령을 완성할 수 있는가. 비켜서 미룰까(짧음), 베어서 지울까(김). 무엇을 먼저 줄일까'],
    ['비교작과 차이', '타이핑 게임은 단어 정확도, 서바이버류는 자동 공격 성장. 이 게임은 "내가 치는 언어 자체"가 성장 대상'],
    ['플랫폼·입력', 'Windows PC(웹 빌드 선행), 물리 키보드 영문 입력, 1280×720 16:9, 한국어 UI. 마우스는 메뉴만'],
    ['모드·세션', '싱글, 오프라인, 한 런 약 5분, 런 중 저장 없음'],
    ['승패', 'HP 0이면 사망. 보스 처치면 클리어. 결과 화면에 기록'],
    ['세계관', '타이틀 한 줄로만 존재: "지워지는 기록의 도시에서, 기억 조각으로 자신의 전투 문장을 되찾는다." 대사·퀘스트 없음'],
    ['수익화', 'MVP는 검증판. 출시 가설은 유료 완결형(Steam, 9,900원)'],
  ], { category: true }),
  notice('수치의 단일 원본은 data/commands.json, cards.json, enemies.json, gauge_and_spawn.json임. 이 문서의 표와 데이터가 다르면 데이터가 맞음.'),
  pageBreak(),
];

// ───────────── II. 핵심 루프 ─────────────
const ch2 = [
  chapter('Ⅱ', '핵심 루프와 대표 플레이'),
  body('한 런은 "적이 예고한다 → 게이지가 차기 전에 명령을 치고 Enter → 베거나 비켜선다 → 조각을 먹고 레벨업 → 카드로 명령을 축약한다"의 반복임. 적은 30초마다 빨라지고 플레이어는 레벨업마다 짧아짐.'),
  cap('대표 플레이 (시간 순)'),
  table([900, 2400, 4038, 2300], ['시각', '사용자 행동', '게임 상태 변화', '예외'], [
    ['0:00', '타이틀에서 "시작"', '런 생성(시드), 보드 11×11, 플레이어 (5,5), 잔병 1 (4,5) 배치, 게이지 8.0초 표시 상태로 세계 정지', '—'],
    ['0:00', 'slash left 입력 후 Enter', '첫 문자에 런 시계 시작. Enter 순간 잔병 피해 2 → 사망, 조각 1 XP 드롭, 반경 1 안이라 즉시 흡수', '게이지가 먼저 차면 피격 HP 4, 원인 "왼쪽 잔병, 명령 미완성(8/10자)"'],
    ['0:06~0:45', '잔병이 6초 간격 등장, 대응', '처치 3회 → XP 3/3 → 레벨업 → 세계 정지, 카드 3장(A01·A03·A06 고정)', '여러 레벨 동시 달성이면 하나씩 선택'],
    ['0:45', '카드 선택 (예: A01 베기 축약 I)', 'slash → sl 허용, 버퍼 보존, 축약표 갱신', '선택 전 Esc 불가(선택 필수)'],
    ['1:30', '속사병 등장(게이지 약 2.5초)', '짧은 명령 필요', '못 피하면 HP −1'],
    ['2:30', '추적자 등장', '인접 안 이동은 소용없음, 벗어나거나 베어야 함. 마지막 1초 예고 고정', '—'],
    ['4:30', '일반 스폰 정지, 보스 등장', '삭제선 패턴 반복, 회복 창 3초에 반격', '285초에는 잔적이 있어도 등장'],
    ['~5:00', '보스 HP 0', '클리어, 남은 조각 일괄 회수, 결과 화면(생존 시간, 레벨, 처치, 선택 순서, 피격 원인, 마지막 10초 기록)', '사망 시 같은 화면에 "사망", 같은 시드/새 시드 재도전'],
  ], { center: [0] }),
  pageBreak(),
];

// ───────────── III. 기본 규칙 ─────────────
const ch3 = [
  chapter('Ⅲ', '기본 규칙'),
  h1('1. 보드와 시간 모델', true),
  item1('보드는 11×11, 왼쪽 위 원점 (0,0), 외곽 1칸은 벽, 내부 9×9가 바닥, 내부 장애물 없음. 플레이어는 (5,5)에서 시작. 칸당 살아 있는 유닛 1개. 판정은 전부 칸 단위임.'),
  item1('시뮬레이션은 50ms 고정 스텝, 렌더링은 별도. 입력은 다음 스텝 시작에 도착 순서대로 처리하며 한 스텝에 여러 키가 가능함.'),
  item1('런 시계는 첫 유효 문자에서 시작하고 레벨업 화면, 일시정지, 창 포커스 상실, 한글 IME 조합 중에는 모든 타이머가 멈춤. 재개 시 유예 없음.'),
  item1('난수는 카드 후보와 스폰 결정에만 쓰며 스트림이 분리됨(xorshift32). 같은 시드와 같은 입력 기록이면 같은 결과가 나옴.', 0),
  h1('2. 명령 문법 (CR-05 Enter 확정)'),
  body('형식은 "동작 [공백] 방향"임. 버퍼에 친 뒤 Enter를 누른 시점에 버퍼 전체가 현재 허용 문법의 완성 명령과 정확히 일치하면 실행하고 버퍼를 비움. 아니면 실패 표시(버퍼 유지). 자동 실행은 없음.'),
  item1('허용 문자 a-z, 1-9, 공백, 마침표. 대문자는 소문자로. 버퍼 최대 24자(초과 무시와 테두리 경고)'),
  item1('Backspace 한 글자, Esc 버퍼 비움(빈 버퍼에서 Esc는 일시정지)'),
  item1('긴 방향 토큰의 마침표는 선택(slash left = slash left.). Enter가 종결자이므로 up과 upleft의 접두어 충돌이 없음'),
  item1('축약 토큰은 해당 카드 보유 시에만 허용. 원형과 이전 랭크 토큰은 계속 유효'),
  item1('공백 생략(A05) 미보유 시 동작과 방향 사이 공백 정확히 1개, 보유 시 0 또는 1개'),
  item1('방향 숫자 단독은 명령이 아님. 이동은 반드시 m으로 시작'),
  item1('실행 시점의 플레이어 위치와 방향으로 대상을 판정하며 입력 중 대상을 고정하지 않음', 0),
  h1('3. 플레이어 행동'),
  cap('행동 5종'),
  table([1500, 1900, 2700, 1700, 900, 938], ['동작', '토큰(랭크 0/1/2)', '범위·판정', '피해·효과', '쿨다운', '시전 중단'], [
    ['베기 slash', 'slash / sl / s', '인접 1칸', '2 (A06: 3/4/5)', '없음', '예'],
    ['찌르기 thrust', 'thrust / th / t', '직선 1..3칸 중 첫 적, 벽에서 정지', '1', '없음', '예'],
    ['막기 guard', 'guard / gu / g', '방향 1개, 1회, 3.0초 (A09: 4/5/6)', '일치 방향 공격 1회 무효. 새 막기는 교체', '없음', '—'],
    ['이동 move', 'm', '인접 1칸. 바닥·비점유·비예약 칸만. 대각선 허용', '고정형 예고 칸 이탈 시 시전 취소', '없음', '—'],
    ['회전베기 spin', 'spin / sp / w (A10)', '방향과 양옆 45도 3칸 각각 판정', '2', '4.0초', '예'],
  ], { category: true, center: [4, 5] }),
  body('대상이 없으면 빈 공격 표시("대상 없음"), 이동 불가면 "이동 불가", 쿨다운 중 회전베기는 "재사용 대기 중"(쿨다운 유지, 버퍼 비움). 명중 순서는 피해 → 사망 → 생존 시 시전 중단(cast 상태일 때만). 명령 완성과 게이지 만료가 같은 스텝이면 플레이어 행동을 먼저 처리함.'),
  cap('방향 토큰'),
  table([3000, 2638, 1500, 2500], ['방향', '긴 토큰', '축약', '축약 카드'], [
    ['위 / 아래', 'up / down', '8 / 2', 'A04 세로'],
    ['오른쪽 / 왼쪽', 'right / left', '6 / 4', 'A03 가로'],
    ['왼쪽 위 / 오른쪽 아래', 'upleft / downright', '7 / 3', 'A16'],
    ['오른쪽 위 / 왼쪽 아래', 'upright / downleft', '9 / 1', 'A17'],
  ], { category: true, center: [2] }),
  h1('4. 한 스텝의 처리 순서'),
  item1('정지 상태면 아무것도 하지 않음'),
  item1('입력을 순서대로 버퍼에 반영. Enter면 즉시 플레이어 행동(피해·사망·중단·이동·막기·쿨다운). 한 스텝에 명령 두 개도 가능'),
  item1('플레이어 이동으로 고정형 예고 칸을 벗어났으면 시전 취소, 추적형은 예고 칸 갱신'),
  item1('적을 ID 순으로 갱신(이번 스텝에 시작한 시전은 줄이지 않음)'),
  item1('만료된 시전의 공격을 ID 순으로 판정. 플레이어 사망이면 이후 생략하고 결과로'),
  item1('막기·쿨다운·스폰 타이머·난도 시계 0.05초 감소(이번 스텝에 만든 타이머 제외)'),
  item1('조각 흡수와 레벨업 계산, 스폰 시도, 보스 등장 조건, 클리어 조건'),
  item1('레벨업 대기열이 있으면 세계 정지', 0),
  pageBreak(),
];

// ───────────── IV. 적과 보스 ─────────────
const ch4 = [
  chapter('Ⅳ', '적과 보스'),
  h1('1. 일반 적', true),
  body('모든 일반 적은 접근 → 시전 → 공격 → 회복 → 접근을 반복함. 접근은 플레이어에 인접한 도달 가능 칸까지 8방향 최단 경로(0.8초에 1칸, 동률은 위부터 시계방향, 다른 유닛은 장애물). 인접 달성 다음 스텝에 시전을 시작하며 시전 시간은 기본 × M(t)(시전 시작 시각의 M 고정). 시전이 끝나는 스텝에 공격하고 1.5초 회복 후 재접근함. 같은 방향에서 동시 시전은 2까지, 초과분은 대기함.'),
  cap('적 3종'),
  table([1300, 700, 700, 1500, 1600, 600, 900, 2338], ['적', 'HP', '피해', '기본 시전', '예고', 'XP', '등장', '가르치는 것'], [
    ['잔병 grunt', '2', '1', '6.0초 (첫 적 8.0)', '고정 1칸', '1', '0초', '기본 명령, 긴 게이지'],
    ['속사병 rapid', '1', '1', '3.0초', '고정 1칸', '1', '90초', '짧은 명령의 필요성. 찌르기 1회로 처치'],
    ['추적자 chaser', '2', '1', '6.0초', '추적, 마지막 1.0초 고정', '2', '150초', '이동만으로는 못 피함'],
  ], { category: true, center: [1, 2, 3, 5, 6] }),
  h2('예고와 취소'),
  item1('고정형(잔병·속사병)은 시전 시작 시점의 플레이어 칸을 예고 칸으로 고정함. 플레이어가 그 칸을 벗어나면 시전이 즉시 취소되고 적은 회복으로 감(적은 남음).'),
  item1('추적형(추적자)은 플레이어가 인접 칸 안에서 움직이면 예고 칸이 따라오고, 인접 밖으로 나가면 취소됨. 마지막 1.0초는 고정되므로 그때 예고 칸을 벗어나면 공격이 빗나감.', 0),
  h2('공격 판정과 피격 원인'),
  item1('예고 칸에 플레이어가 있으면: 막기 방향이 적 방향과 일치하면 막기 소모(피해 0), 아니면 HP −피해. 막기는 1회만 막으므로 같은 스텝의 두 공격은 하나만 막힘(낮은 ID 먼저).'),
  item1('피격 원인은 항상 문장으로 남음: "왼쪽 잔병, 명령 미완성(9/10자)", "왼쪽 잔병, Enter 누르기 전", "왼쪽 두 번째 공격, 막기 소모 뒤 도착", "왼쪽 잔병, 막기 방향 불일치", "집행자 삭제선 2".', 0),
  h2('사망과 조각'),
  item1('적이 죽은 칸에 XP 조각이 떨어지고(벽이면 가장 가까운 바닥), 소멸하지 않으며 같은 칸은 합산됨. 플레이어는 매 스텝 Chebyshev 반경 1(A12: 2/3) 안의 조각을 흡수함. 레벨업 화면 중에는 흡수하지 않음.', 0),
  h1('2. 보스: 기억의 집행자'),
  body('보스는 축약된 언어로 순차 예고에 대응하는 시험임. HP 14, 피해 2, 중단 면역, XP 0. 회복 창 3초에 찌르기 2회 이상이 들어가야 하며 회복 창 3~4번에 처치하는 것이 목표임.'),
  cap('보스 규칙'),
  table([2000, 7638], ['항목', '규칙'], [
    ['등장 조건', '270초에 일반 스폰 정지. 살아 있는 일반 적이 0이 되거나 285초가 되면 등장(먼저 오는 쪽). 위치는 플레이어 오른쪽 거리 3, 막히면 시계방향 다음 방향'],
    ['정렬', '플레이어와 같은 행 또는 열, 거리 2를 목표로 1.2초에 1칸 이동. 같은 행/열에서 거리 1~3이면 패턴 시작'],
    ['삭제선 1단', '보스에서 플레이어 방향 직선 3칸, 시전 2.4초, 피해 2'],
    ['간격', '0.6초'],
    ['삭제선 2단', '1단과 직교하는 방향으로 플레이어 현재 칸을 중심으로 3칸, 시전 1.5초, 피해 2'],
    ['회복', '3.0초. 이동·예고 없음. 이 창이 반격 구간. 난도 배율 미적용'],
    ['예고 고정', '보스 시전 중 플레이어 이동으로 예고 칸이 바뀌지 않음(직선 고정). 피하려면 선 밖으로 나가야 함'],
    ['난도 배율 (CR-01)', '시전 시간에 M(t)를 곱하되 하한 1.0 → 사실상 미적용. 원안대로면 270초에 1단 0.8초·2단 0.5초로 회피 불가'],
    ['막기', '1단은 보스 방향 막기로 막힘. 2단은 선이 칸을 관통하므로 1단 축 또는 보스 방향이면 막힘(보수적 해석)'],
    ['클리어', '보스 HP 0 → 남은 조각 일괄 회수(레벨업 화면 없음) → 결과'],
  ], { category: true }),
  pageBreak(),
];

// ───────────── V. 성장 ─────────────
const ch5 = [
  chapter('Ⅴ', '성장: XP와 카드'),
  body('레벨 L에서 다음 레벨까지 필요한 XP는 3 + (L − 1)임(누적 3, 7, 12, 18, 25, 33, 42, 52). 5분에 6~9회 레벨업이 목표임. 초과 XP는 보존되고 여러 레벨을 한 번에 오르면 카드 화면이 연속으로 뜨며, 사망과 같은 스텝이면 사망이 우선임.'),
  body('레벨업마다 카드 3장을 제시함. 슬롯 1·2는 축약(주식), 슬롯 3은 성능(반찬)임. 슬롯 1은 동작 또는 문법 축약, 슬롯 2는 방향 또는 문법 축약이며 서로 다른 계열임. 첫 레벨업은 A01·A03·A06 고정임. 해당 계열에 줄 카드가 없으면 다른 계열로 채우고, 전부 없으면 "응급 회복(HP +1)" 1장임. 선택은 필수이고 선택 중 세계는 정지함. 랭크 값은 절대값이며 누적하지 않음.'),
  cap('카드 14종'),
  table([700, 2000, 1500, 900, 2800, 1738], ['ID', '이름', '계열', '최대 랭크', '효과', '선행 조건'], [
    ['A01', '베기 축약', '축약·동작', '2', 'slash → sl → s', '—'],
    ['A02', '막기 축약', '축약·동작', '2', 'guard → gu → g', '—'],
    ['A18', '찌르기 축약', '축약·동작', '2', 'thrust → th → t', '—'],
    ['A11', '회전베기 축약', '축약·동작', '2', 'spin → sp → w', 'A10'],
    ['A03', '가로 축약', '축약·방향', '1', 'left/right → 4/6', '—'],
    ['A04', '세로 축약', '축약·방향', '1', 'up/down → 8/2', '—'],
    ['A16', '왼쪽 위 대각 축약', '축약·방향', '1', 'upleft/downright → 7/3', '—'],
    ['A17', '오른쪽 위 대각 축약', '축약·방향', '1', 'upright/downleft → 9/1', '—'],
    ['A05', '연결 기억', '축약·문법', '1', '동작과 방향 사이 공백 생략 가능 (s4)', '동작 축약 1개 이상 + 방향 축약 1개 이상'],
    ['A06', '날 세우기', '성능·공격', '3', '베기 피해 3 / 4 / 5', '—'],
    ['A08', '단단한 몸', '성능·생존', '3', '최대 HP 6 / 7 / 8, 선택 시 HP +1', '—'],
    ['A09', '오래 막기', '성능·생존', '3', '막기 지속 4 / 5 / 6초', '—'],
    ['A10', '회전베기', '성능·스킬', '1', 'spin 해금(슬롯 1)', '스킬 미보유'],
    ['A12', '기억 끌어당기기', '성능·보조', '2', '흡수 반경 2 / 3', '—'],
  ], { category: true, center: [3] }),
  notice('카드 본문은 현재 보유한 축약만 반영해 예시를 보여 줌(예: "베기 명령 slash left → sl left (10자 → 7자). 피해와 재사용 대기는 그대로"). 미보유 축약을 포함한 최단 명령을 지금 쓸 수 있는 것처럼 보여 주지 않음.'),
  pageBreak(),
];

// ───────────── VI. 스폰과 난이도 ─────────────
const ch6 = [
  chapter('Ⅵ', '스폰과 난이도'),
  h1('1. 난도 곡선', true),
  body('모든 적의 시전 시간에 M(t) = max(0.30, 0.92^floor(t/30))을 곱함(CR-02로 0.88 → 0.92). 런 시계 t는 정지 중 멈춤.'),
  cap('M(t) 참조표'),
  table([2000, 2000, 2819, 2819], ['t(초)', 'M', '잔병 시전(초)', '속사병 시전(초)'], [
    ['0', '1.000', '6.0', '3.0'], ['60', '0.846', '5.1', '2.5'], ['120', '0.716', '4.3', '2.1'], ['180', '0.606', '3.6', '1.8'], ['240', '0.513', '3.1', '1.5'], ['270', '0.472', '2.8', '1.4'], ['300', '0.434', '2.6', '1.3'],
  ], { center: [0, 1, 2, 3] }),
  h1('2. 스폰'),
  body('밴드별 간격마다 시도하고, 살아 있는 일반 적(예고 포함)이 상한이면 건너뛰고 다음 간격에 재시도함(누적 없음). 위치는 플레이어 기준 Chebyshev 거리 4의 링에서 난수로 고르고, 벽·유닛·예약 칸이면 시계방향 다음 칸, 링 전체가 불가면 거리 3, 그래도 없으면 0.5초 뒤 재시도함. 예고 1.0초 동안 그 칸은 이동 목적지로 쓸 수 없음.'),
  cap('스폰 밴드'),
  table([1600, 1200, 2000, 4838], ['구간(초)', '간격', '동시 상한', '구성'], [
    ['0~45', '6.0', '2', '잔병 100% (첫 적은 (4,5) 즉시 배치, 시전 8.0)'],
    ['45~90', '5.0', '3', '잔병 100%'],
    ['90~150', '4.5', '3', '잔병 75%, 속사병 25%'],
    ['150~210', '4.0', '3 (CR-02: 4→3)', '잔병 50%, 속사병 25%, 추적자 25%'],
    ['210~270', '3.5', '3 (CR-02: 4→3)', '잔병 40%, 속사병 30%, 추적자 30%'],
    ['270~', '—', '0', '일반 스폰 정지, 보스'],
  ], { center: [0, 1, 2] }),
  h1('3. 파라미터와 허용 범위'),
  body('개발 세션은 봇 시뮬레이션 근거로 허용 범위 안에서만 조정함. 범위 밖은 기획 변경 요청 대상임.'),
  cap('파라미터'),
  table([2800, 1600, 1700, 3538], ['파라미터', '현재값', '허용 범위', '목표'], [
    ['잔병·추적자 기본 시전', '6.0초', '4.0~8.0', '40 WPM이 slash left + Enter(약 3.3초 + 반응 1초)를 t=0에 완성'],
    ['속사병 기본 시전', '3.0초', '2.0~4.0', '축약 1단계로 대응 가능'],
    ['난도 감쇠', '0.92', '0.85~0.92', '—'],
    ['감쇠 단계', '30초', '20~45', '—'],
    ['배율 하한', '0.30', '0.25~0.40', '잔병 1.8초'],
    ['레벨 비용', '3 + 1×(L−1)', '2~4 / 1~2', '5분 6~9회 레벨업'],
    ['스폰 간격·상한', '밴드 표', '±1.5초 / ±1', '처치 30~50'],
    ['막기 지속', '3.0초', '2.0~4.0', '잔병 게이지 절반'],
    ['회전베기 쿨다운', '4.0초', '3.0~6.0', '—'],
    ['보스 HP', '14', '10~20', '회복 창 3~4회에 처치'],
    ['적 이동 간격', '0.8초', '0.6~1.2', '—'],
  ], { category: true, center: [1, 2] }),
  pageBreak(),
];

// ───────────── VII. 튜토리얼과 화면 ─────────────
const ch7 = [
  chapter('Ⅶ', '튜토리얼과 화면'),
  h1('1. 튜토리얼', true),
  body('강제 단계 없이 힌트로만 가르침. 힌트는 시간으로 지우지 않고 학습 행동이 완료되면 지움. 설정에서 끌 수 있고 보상 차이는 없음. 첫 레벨업까지 힌트 3개 이하만 노출함.'),
  cap('튜토리얼 힌트'),
  table([1000, 1900, 2400, 4338], ['단계', '가르치는 규칙', '시작 → 종료', '문구'], [
    ['TUT-01', '명령 완성으로 시작', '런 시작 → 첫 유효 문자', '"왼쪽 적을 베려면 slash left 를 입력하고 Enter 를 누르세요. 입력하면 시간이 흐릅니다." (명령창에 회색 예시)'],
    ['TUT-02', '게이지와 남은 글자', '첫 문자 → 첫 처치', '링 왼쪽 게이지 옆 "남은 글자 N" 강조'],
    ['TUT-03', '비켜서기', '두 번째 적 시전 시작 → 이동 또는 처치', '"m right 처럼 이동 명령으로 비켜서면 공격이 취소됩니다. 적은 남습니다."'],
    ['TUT-04', '조각과 레벨업', '첫 조각 드롭 → 첫 레벨업', '"떨어진 조각에 다가가면 경험치가 됩니다."'],
    ['TUT-05', '카드 읽기', '첫 레벨업 화면 → 선택', '"축약 카드는 명령을 짧게, 성능 카드는 수치를 올립니다. 왼쪽 두 장은 축약입니다."'],
    ['TUT-06', '축약 체감', '첫 축약 선택 후 첫 명령 → 완성', '"이제 sl left 7자"'],
  ], { category: true }),
  h1('2. 화면 흐름'),
  body('화면은 8개이고 모두 키보드만으로 조작됨. 모달은 게임 시계를 멈추고, 배경 입력을 막고, 닫으면 이전 포커스로 돌아감.'),
  cap('화면'),
  table([1700, 1500, 2300, 2938, 1200], ['화면', '종류', '진입', '행동', '목적지'], [
    ['타이틀', '전체', '실행, 결과에서 복귀', '위/아래·Enter (시작·설정·기록·종료)', '런·설정·기록'],
    ['전투 HUD', '전체', '시작', '문자 입력, Enter, Backspace, Esc, F10', '레벨업·일시정지·결과'],
    ['레벨업', '모달(정지)', '레벨업 대기열', '1/2/3 강조, Enter·클릭 확정(0.3초 연타 방지). 취소 없음', 'HUD 또는 다음 카드'],
    ['일시정지', '모달', 'F10, 빈 버퍼 Esc, 포커스 상실 후', '계속·설정·처음부터(확인)·타이틀로(확인)', '—'],
    ['설정', '모달', '타이틀·일시정지', '좌우로 값 변경, 즉시 적용·저장', '호출 화면'],
    ['결과', '전체', '사망·클리어', '1 같은 시드 / 2 새 시드 / 타이틀', '런·타이틀'],
    ['기록', '전체', '타이틀', '최근 50건 스크롤', '타이틀'],
    ['IME·포커스 안내', '오버레이(정지)', '한글 조합 감지 / 창 포커스 상실', '영문 전환 시 자동 해제 / 클릭·키로 해제(그 키는 버퍼에 넣지 않음)', 'HUD'],
  ], { category: true }),
  h2('전투 HUD가 보여 주는 정보'),
  item1('보드, 플레이어 주변 8구간 링(방향별 시전 게이지·남은 초·적 아이콘, 축약된 방향은 바탕 호가 밝음, 남은 1초 이하는 붉은 경고), 위험 칸 빗금(추적은 점선, 고정은 실선)'),
  item1('명령창(버퍼, 남은 글자 또는 후보 3개, 완성 시 Enter 표시, 실패 시 붉은 깜박임), 시계, HP 칸, XP 바'),
  item1('축약표(동작 5행 + 방향 4행, 바뀐 행 0.6초 강조), 회전베기 쿨다운, 힌트 또는 피격 원인(3초 표시)', 0),
  h2('설정과 접근성'),
  item1('전체 음량 0~100(기본 80), 입력음 켜기/끄기, 약한 효과(파편·잔상 축소, 위험 칸·게이지 유지), 힌트 표시(다음 런부터), 전체 화면. 변경 즉시 저장, 재진입 시 유지'),
  item1('색만으로 상태를 구분하지 않고 모양·굵기·텍스트를 병행함. 화면 전체 점멸 없음. 결과 화면의 피격 목록은 실제 피격 이벤트와 일치하며 마지막 10초의 명령·피격 기록을 보여 줌', 0),
  pageBreak(),
];

// ───────────── VIII. 밸런스 ─────────────
const ch8 = [
  chapter('Ⅷ', '밸런스 목표와 시뮬레이션 결과'),
  body('계산 결과와 재미 검증은 다름. 재미는 사람 시험으로만 판단하고, 아래 표는 가상 플레이어(고정 WPM·반응·정책)로 파라미터가 이상하지 않은지만 확인함.'),
  cap('난이도 목표와 봇 결과 (2026-09-20, 20시드)'),
  table([1900, 2200, 1100, 1100, 3338], ['집단', '요구', '목표', '허용', '봇 결과'], [
    ['25 WPM (반응 1.0초)', '축약 2개 이상 선택으로 3분 생존', '60%', '40~80%', '평균 생존 67초, 3분 생존 0%'],
    ['40 WPM (반응 0.7초)', '클리어 가능', '40%', '25~60%', '3분 생존 30%, 클리어 0%'],
    ['60 WPM (반응 0.5초)', '축약 없이 클리어 불가', '축약 0이면 4분 전 사망', '—', '축약 우선: 3분 생존 90%, 클리어 10% / 성능 우선: 3분 생존 70%'],
    ['이동만 반복', '3분 이내 사망', '100%', '—', '평균 64초 사망 (통과)'],
  ], { category: true, center: [2, 3] }),
  body('봇은 한 번에 명령 하나만 결정하고 대상이 바뀔 때마다 반응 시간을 쓰므로 사람보다 둔함. 그래도 "축약 선택이 생존을 좌우한다"(축약 90% vs 성능 70%)와 "회피만으로는 죽는다"는 데이터로 확인됨. 목표(40 WPM 클리어 40%)에는 미달이며 사람 시험 후 게이지·스폰 파라미터를 허용 범위 안에서 다시 잡음.'),
  notice('시험 지표: 출시 전 8~12명, 25/40/60 WPM 각 집단의 사망 원인 분포와 "다시 하고 싶은가".'),
  pageBreak(),
];

// ───────────── IX. 기준 사례 ─────────────
const ch9 = [
  chapter('Ⅸ', '로직 기준 사례'),
  body('아래 사례는 규칙의 경계를 고정하는 것이며 전부 자동 테스트로 구현돼 있음. 규칙을 바꿀 때는 이 표부터 고침.'),
  cap('기준 사례'),
  table([1600, 2900, 3438, 1700], ['ID', '상황', '기대 결과', '금지'], [
    ['S-01 동시 도착', '잔병 시전 0.05초 남음, slash left 쳤고 같은 스텝에 Enter', '잔병 사망, HP 그대로', '플레이어 피격'],
    ['S-02 한 글자 늦음', '만료 스텝에 버퍼 slash lef', 'HP 4, 버퍼 유지, "왼쪽 잔병, 명령 미완성(9/10자)"', '버퍼 소실'],
    ['S-02b Enter 전', '완성 문자열이 있지만 Enter 전 만료', '피격, "Enter 누르기 전". 잘못된 Enter는 실패 표시와 버퍼 유지', '버퍼 소실'],
    ['S-03 이동 취소', '잔병 시전 중 m right', '(6,5) 이동, 시전 취소, 1.5초 회복 후 재접근', '피해'],
    ['S-04 추적자 마지막 1초', 'remaining 0.9초에 인접 안 이동', '예고 칸 갱신 안 됨, 예고 밖이면 빗나감', '예고 칸 이동'],
    ['S-05 막기 1회', '왼쪽 막기, 같은 스텝 공격 2', '첫 공격 막힘, 두 번째 HP −1', '둘 다 막힘'],
    ['S-06 미보유 축약', 'A01 없이 sl left', '실행 없음, "sl: 미보유 축약"', '자동 실행'],
    ['S-07 접두어', 'slash up / slash upleft', 'Enter 확정이므로 둘 다 그 자체로 완성', '—'],
    ['S-08 공백 생략', 'A05 + A01 r2 + A03, s4', '왼쪽 베기 (2자)', '—'],
    ['S-09 사망 우선', 'HP 1 피격과 레벨업 조건 동시', '사망, 레벨업 없음', '레벨업'],
    ['S-10 다중 레벨업', 'XP 2/3 + 조각 9', 'L1→L3, 카드 2회 연속, 초과 4 보존', '초과 소실'],
    ['S-11 회전베기 쿨다운', '쿨다운 2초 남은 채 spin left', '실패 표시, 쿨다운 그대로, 버퍼 비움', '쿨다운 초기화'],
    ['S-12 스폰 상한', '상한 도달', '스폰 없음, 다음 간격 재시도, 누적 없음', '상한 초과'],
    ['S-13 보스 등장', '270초 잔병 2 생존', '285초에 등장, 잔병 유지', '잔병 소멸'],
    ['S-14 보스 회복 창', '회복 중 thrust right', 'HP −1, 중단 없음, 회복 유지', '회복 중단'],
    ['S-15 IME', '전투 중 한글 조합', '세계 정지, 안내, 조합 문자 미반영, 복귀 시 유예 없이 재개', '조합 문자 실행'],
    ['S-16 재현성', '시드 12345 + 입력 기록 재생', '동일 결과 해시', '차이'],
  ], { category: true }),
  pageBreak(),
];

// ───────────── X. 확장 층 ─────────────
const ch10 = [
  chapter('Ⅹ', '첫 출시 확장 층'),
  body('MVP 코드가 읽되 비어 있는 자리임. 존재하지 않는 콘텐츠를 지금 명세하지 않음.'),
  cap('확장 자리'),
  table([1500, 1800, 2900, 3438], ['항목', 'MVP', '첫 출시', '데이터 자리'], [
    ['런 길이', '5분', '15분', 'gauge_and_spawn.bands를 15분으로, 보스 조건 900초'],
    ['적', '3종 + 보스', '6종 + 보스 (거병·파쇄병·술사 추가)', 'enemies.json 항목 추가. attack_shape에 adjacent_fan_three_fixed, ray_three, pierce_guard 예약'],
    ['직업', '없음', '3종 (시작 스킬, 전용 카드)', 'cards.json required_class, player.start_skills, skills_slots 2'],
    ['아레나', '열린 뜰 1', '장애물 있는 아레나 추가', 'board.interior_obstacles 좌표 목록'],
    ['해금', '없음', '직업·아레나 해금', 'profile 확장'],
    ['수익화', '비상업 검증판', '유료 완결형 (Steam, 9,900원)', '—'],
  ], { category: true }),
  notice('"5분 분량 부족" 리뷰가 나오면 15분 런을 첫 업데이트로 무료 추가함(제안서 참조).'),
  pageBreak(),
];

// ───────────── XI. 이력 ─────────────
const ch11 = [
  chapter('Ⅺ', '결정과 변경 이력'),
  h1('1. 기획 단계 위임 결정 (DC-07, 2026-09-17 일괄 승인)', true),
  item1('50ms 고정 스텝과 플레이어 우선: 재현성과 "마지막 글자에 살아남는" 경험'),
  item1('게이지 6.0·3.0·6.0초 × M(t): 40 WPM 기준 계산'),
  item1('XP 3+(L−1): 축약 6회 이상 체감'),
  item1('카드 14종, 첫 화면 고정, 슬롯 구조(축약 2 + 성능 1)'),
  item1('적 3종 + 보스. 거병(부채꼴)은 첫 출시로'),
  item1('스폰 밴드 5개, 링 거리 4, 예고 1초. 무한 회피는 누적으로 억제'),
  item1('스킬은 회전베기 1종, 쿨다운 4초, 슬롯 1'),
  item1('보드 11×11, 타일 56px. 저장은 프로필만, 런 중 저장 없음, 입력 기록 재생', 0),
  h1('2. 구현 중 변경'),
  cap('변경 이력'),
  table([1000, 4200, 2838, 1600], ['ID', '내용', '근거', '지위'], [
    ['CR-05', '명령은 완성 즉시 실행이 아니라 Enter로 실행. 잘못된 Enter는 실패 표시(버퍼 유지). 긴 방향 토큰의 마침표는 선택', '사용자 결정 (2026-09-17)', '확정'],
    ['CR-01', '보스 시전 시간에 난도 배율 하한 1.0 (사실상 미적용)', '원안이면 270초에 삭제선이 0.8/0.5초로 회피 불가. 봇 전원 사망', '기획 확인 요청'],
    ['CR-02', '난도 감쇠 0.88 → 0.92, 밴드 4·5 동시 상한 4 → 3', '봇 20시드: 40 WPM 3분 생존 0% → 30~45%', '허용 범위 안'],
  ], { category: true, center: [3] }),
  h1('3. 기획서에 없어 보수적으로 해석한 것'),
  item1('IS-06: m 6. 표기. 숫자 축약에는 마침표가 없음(s4 = 2자). 데이터를 따름'),
  item1('IS-07: 보스 정렬. 거리 2 목표로 이동하되 같은 행/열 거리 1~3이면 패턴 시작'),
  item1('IS-08: 보스 2단 막기 방향. 1단 축 또는 보스 방향이면 막힘'),
  item1('스폰 첫 시도 시각: 밴드 0의 간격(6초) 뒤'),
  item1('피격 원인의 total 글자 수: 버퍼가 유효 접두어면 최단 후보 길이, 비어 있거나 무효면 그 방향 베기 최단 길이', 0),
  notice('이 문서는 기획 기준본(GAME_SPEC 1.0, PROJECT_CONTROL, data/ 4파일, UI_UX_HANDOFF의 화면 흐름)을 게임 규칙 관점으로 합친 것임. 시각 디자인(DESIGN_SPEC, 에셋 계약, 브리프)과 기술 구조(TECH_QA)는 포함하지 않음.'),
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
  title: 'SHORTHAND 게임 기획서',
  styles: { default: { document: { run: { font: font(F.body), size: 24, color: C.text }, paragraph: { spacing: { line: 348, after: 0 } } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, right: 1134, bottom: 1020, left: 1134, header: 0, footer: 454, gutter: 0 } } },
    footers: { default: footer },
    children: [...cover, ...toc, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9, ...ch10, ...ch11],
  }],
});

const out = new URL('./SHORTHAND_게임_기획서.docx', import.meta.url);
writeFileSync(out, await Packer.toBuffer(doc));
console.log('written');
void h2; void item2;
