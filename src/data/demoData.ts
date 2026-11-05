/**
 * 虛擬資料：模擬 Google 試算表各分頁（以 gid 為索引）的 CSV 內容。
 * 欄位格式與真實試算表一致，因此 sheetData.ts / directData.ts 的解析程式完全不用改。
 * 所有姓名、員編、成績皆為隨機產生的範例，與任何真實人員無關。
 */

type Rows = string[][];

// 固定亂數種子：每次載入資料都相同，方便比對畫面調整前後的差異
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261103);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

const TODAY = new Date('2026-11-03T00:00:00');
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
const fmtStamp = (d: Date) =>
  `${fmtDate(d)} ${pad(between(9, 20))}:${pad(between(0, 59))}:${pad(between(0, 59))}`;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const clampDate = (d: Date) => (d > TODAY ? addDays(TODAY, -between(1, 20)) : d);

// ---------- 姓名 ----------
const SURNAMES = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '邱', '曾', '廖', '賴', '徐'];
const GIVEN = [
  '怡君', '雅婷', '承恩', '宗翰', '佳穎', '建宏', '詩涵', '冠宇', '柏翰', '怡萱', '家豪', '品妍', '俊傑', '郁婷', '子睿',
  '佩珊', '志偉', '欣怡', '彥廷', '雅雯', '冠霖', '宜蓁', '哲維', '映彤', '凱文', '思妤', '昱廷', '芷瑄', '紹軒', '亭妤',
  '政翰', '靜宜', '博文', '婉如', '宇軒', '雅筑', '仕杰', '依婷', '韋廷', '馨儀', '浩然', '采潔', '嘉豪', '姿穎', '育誠',
  '美玲', '尚恩', '敏慧', '羿安', '心怡',
];
const usedNames = new Set<string>();
function newName(): string {
  for (let i = 0; i < 500; i++) {
    const n = pick(SURNAMES) + pick(GIVEN);
    if (!usedNames.has(n)) {
      usedNames.add(n);
      return n;
    }
  }
  throw new Error('姓名不足');
}

// ---------- 課程與考試清單（gid 2124489402）----------
const VIDEO = 'https://www.youtube.com/watch?v=M7lc1UVf-VE';

// ---- 示範教材：圖片（SVG）與 PDF 以內嵌網址產生，不需要外部檔案 ----
function svgPoster(title: string, points: string[], color: string): string {
  const lines = points
    .map((p, i) => `<text x="80" y="${270 + i * 74}" font-size="34" fill="#163024">${i + 1}. ${p}</text>`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" font-family="sans-serif">` +
    `<rect width="1280" height="720" fill="#f0f7f1"/><rect width="1280" height="14" fill="${color}"/>` +
    `<text x="80" y="140" font-size="58" font-weight="700" fill="${color}">${title}</text>` +
    `<text x="80" y="196" font-size="24" fill="#5e9774">示範教材圖片</text>${lines}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function demoPdf(title: string, lines: string[]): string {
  const esc = (s: string) => s.replace(/[()\\]/g, (m) => '\\' + m);
  let content = `BT /F1 22 Tf 60 780 Td (${esc(title)}) Tj ET\n`;
  lines.forEach((l, i) => {
    content += `BT /F1 14 Tf 60 ${735 - i * 30} Td (${esc(l)}) Tj ET\n`;
  });
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offs: number[] = [];
  objs.forEach((o, i) => {
    offs.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  pdf += offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return 'data:application/pdf;base64,' + btoa(pdf);
}

const POSTER_BRAND = svgPoster('品牌理念與門市動線', ['認識品牌故事與價值', '熟悉門市各區域動線', '服務禮儀的三個基本動作'], '#2c6144');
const POSTER_TEA = svgPoster('茶湯萃取溫度對照', ['綠茶：75–80°C，約 2 分鐘', '烏龍：90–95°C，約 3 分鐘', '紅茶：95–100°C，約 4 分鐘'], '#1f8657');
const PDF_POS = demoPdf('POS Operation Handout (Demo)', ['1. Open the shift and count the cash drawer.', '2. Enter the order and confirm the items.', '3. Choose the payment method and print the receipt.', '4. Close the shift and check the daily report.']);
const PDF_DRINK = demoPdf('Signature Drink Checklist (Demo)', ['1. Check the tea base temperature.', '2. Measure toppings with the standard scoop.', '3. Seal the cup and confirm the label.']);
const COURSE_HEADER = ['課程名稱', '課程類別', '訓練時數', '及格門檻', '是否必修', '晉升條件', '教材網址', '課程說明'];
const COURSE_DEFS: { name: string; cat: string; hours: number; pass: string; req: string; prom: string; video: string; desc: string }[] = [
  { name: '1.新人入門與品牌認識', cat: '基礎課程', hours: 2, pass: '', req: '必修', prom: '基礎', video: `${VIDEO} ${POSTER_BRAND}`, desc: '認識品牌理念、門市動線與基本禮儀，是所有新夥伴的第一堂課。' },
  { name: '2.飲品製作基礎', cat: '基礎課程', hours: 4, pass: '', req: '必修', prom: '基礎', video: VIDEO, desc: '標準配方、量具使用與出杯流程。' },
  { name: '3.服務流程與禮儀', cat: '基礎課程', hours: 3, pass: '', req: '必修', prom: '基礎', video: VIDEO, desc: '點餐、結帳到送客的完整服務動線。' },
  { name: '4.POS 收銀操作', cat: '基礎課程', hours: 2, pass: '', req: '必修', prom: '基礎', video: PDF_POS, desc: '收銀系統操作與帳務結算。' },
  { name: '5.茶湯萃取與風味', cat: '匠心課程', hours: 4, pass: '', req: '正職必修', prom: '匠心', video: POSTER_TEA, desc: '不同茶種的萃取溫度、時間與風味調整。' },
  { name: '6.招牌飲品精修', cat: '匠心課程', hours: 4, pass: '', req: '正職必修', prom: '匠心', video: `${VIDEO} ${PDF_DRINK}`, desc: '招牌飲品的細節與品質穩定度訓練。' },
  { name: '7.備料區標準作業', cat: '匠心課程', hours: 3, pass: '', req: '正職必修', prom: '匠心', video: '', desc: '備料流程、保存期限與損耗控管。' },
  { name: '8.門市排班與人力管理', cat: '領航課程', hours: 4, pass: '', req: '店長/組長', prom: '領航', video: VIDEO, desc: '排班原則、人力配置與離職率管理。' },
  { name: '9.客訴處理與危機應變', cat: '領航課程', hours: 3, pass: '', req: '店長/組長', prom: '領航', video: VIDEO, desc: '常見客訴情境與標準回應流程。' },
  { name: '10.店長領導力', cat: '領航課程', hours: 6, pass: '', req: '店長/組長', prom: '領航', video: '', desc: '團隊溝通、目標設定與帶人實務。' },
  { name: '食品安全', cat: '食安課程', hours: 2, pass: '80', req: '必修', prom: '基礎', video: VIDEO, desc: '食品衛生法規、交叉汙染與溫度管理。' },
  { name: '基礎認證測驗', cat: '基礎測驗', hours: 1, pass: '85', req: '必修', prom: '基礎', video: '', desc: '' },
  { name: '匠心認證測驗', cat: '匠心測驗', hours: 1, pass: '85', req: '正職必修', prom: '匠心', video: '', desc: '' },
  { name: '領航認證考試', cat: '領航考試', hours: 1, pass: '85', req: '店長/組長', prom: '領航', video: '', desc: '' },
];

// ---------- 員工（gid 873785037）----------
interface Emp {
  empNo: string;
  name: string;
  gender: string;
  dept: string;
  position: string;
  hire: Date;
  leave: Date | null;
}
const STORES = ['台北信義', '台北西門', '新北板橋', '桃園中壢', '新竹竹北', '台中逢甲', '台南東區', '高雄巨蛋'];
const FRANCHISE_STORES = ['宜蘭礁溪', '花蓮中華', '彰化員林', '嘉義文化', '屏東中正', '基隆仁愛', '苗栗頭份', '南投草屯'];
const emps: Emp[] = [];
let seq = 0;
function addEmp(dept: string, position: string, hireFrom: [number, number], leaveProb = 0) {
  seq++;
  const hire = clampDate(new Date(between(hireFrom[0], hireFrom[1]), between(0, 11), between(1, 28)));
  let leave: Date | null = null;
  if (rnd() < leaveProb) {
    leave = clampDate(addDays(hire, between(60, 500)));
    if (leave <= hire) leave = null;
  }
  emps.push({
    empNo: `LF${String(seq).padStart(4, "0")}`,
    name: newName(),
    gender: rnd() < 0.55 ? '女' : '男',
    dept,
    position,
    hire,
    leave,
  });
}
for (const s of STORES) {
  const dept = `UG${s}店`;
  addEmp(dept, '店長', [2022, 2024]);
  for (let i = 0; i < between(1, 2); i++) addEmp(dept, '組長', [2023, 2025]);
  addEmp(dept, '儲備幹部', [2025, 2026]);
  for (let i = 0; i < between(2, 3); i++) addEmp(dept, '正職', [2024, 2026], 0.15);
  for (let i = 0; i < between(4, 6); i++) addEmp(dept, '兼職', [2025, 2026], 0.3);
}
for (let i = 0; i < 3; i++) addEmp('茶飲營運部', '督導', [2021, 2023]);
for (const s of FRANCHISE_STORES) {
  const dept = `加盟-${s}店`;
  addEmp(dept, '加盟主', [2024, 2025]);
  for (let i = 0; i < between(2, 4); i++) addEmp(dept, '店員', [2025, 2026]);
}

const EMP_HEADER = ['員編', '姓名', '性別', '部門', '職位', '入職日', '離職日'];
const employeeRows: Rows = [
  EMP_HEADER,
  ...emps.map((e) => [e.empNo, e.name, e.gender, e.dept, e.position, fmtDate(e.hire), e.leave ? fmtDate(e.leave) : '']),
];

// ---------- 課程簽到總表（gid 552384353）與考試紀錄 ----------
const SIGN_HEADER = ['期數', '員編', '姓名', '部門', '職位', '課程名稱', '簽到日期'];
const EXAM_HEADER = ['考試日期', '員編', '姓名', '部門', '考試科目', '分數'];
const signRows: Rows = [SIGN_HEADER];
const examAllRows: Rows = [EXAM_HEADER];
const examLatestRows: Rows = [EXAM_HEADER];

const periodOf = (d: Date) => `${d.getFullYear()}年${pad(d.getMonth() + 1)}月期`;
const scoreFor = (base: number) => Math.max(45, Math.min(100, Math.round(base + (rnd() + rnd() + rnd() - 1.5) * 18)));

function sit(e: Emp, subject: string, start: Date, pass: number, skill: number) {
  const attempts: { d: Date; s: number }[] = [];
  let d = clampDate(start);
  for (let a = 0; a < 3; a++) {
    const s = scoreFor(skill + a * 5);
    attempts.push({ d, s });
    if (s >= pass) break;
    d = clampDate(addDays(d, between(7, 21)));
  }
  // 「考試全紀錄」放 30 天前的歷次考試，「最新考試成績」放近 30 天的，兩個分頁不重疊
  const recentCut = addDays(TODAY, -30);
  attempts.forEach((t) =>
    (t.d >= recentCut ? examLatestRows : examAllRows).push([fmtStamp(t.d), e.empNo, e.name, e.dept, subject, String(t.s)])
  );
}

const directEmps = emps.filter((e) => e.dept.startsWith('UG') || e.dept === '茶飲營運部');
for (const e of directEmps) {
  const isHQ = e.dept === '茶飲營運部';
  const regular = ['店長', '組長', '儲備幹部', '正職'].includes(e.position);
  const manager = e.position === '店長' || e.position === '組長';
  const skill = manager ? 91 : regular ? 87 : 83;
  const tenureDays = Math.max(0, Math.floor(((e.leave ?? TODAY).getTime() - e.hire.getTime()) / 86400000));

  // 基礎課程：到職 2 週內陸續上完（兼職 / 新人可能還沒上完）
  const basics = COURSE_DEFS.filter((d) => d.cat === '基礎課程');
  basics.forEach((c, i) => {
    if (tenureDays < 14 + i * 7) return;
    if (rnd() < 0.06) return;
    const d = clampDate(addDays(e.hire, 5 + i * 6 + between(0, 4)));
    signRows.push([periodOf(d), e.empNo, e.name, e.dept, e.position, c.name, fmtDate(d)]);
  });
  if (tenureDays >= 45) sit(e, '基礎認證測驗', addDays(e.hire, 40), 85, skill);
  if (tenureDays >= 10) sit(e, '食品安全', addDays(e.hire, between(5, 25)), 80, skill + 2);

  // 匠心：正職才需要
  if (regular && tenureDays >= 120) {
    COURSE_DEFS.filter((d) => d.cat === '匠心課程').forEach((c, i) => {
      if (rnd() < 0.12) return;
      const d = clampDate(addDays(e.hire, 90 + i * 8 + between(0, 6)));
      signRows.push([periodOf(d), e.empNo, e.name, e.dept, e.position, c.name, fmtDate(d)]);
    });
    if (rnd() < 0.8) sit(e, '匠心認證測驗', addDays(e.hire, 130), 85, skill);
  }
  // 領航：店長 / 組長
  if (manager && tenureDays >= 300 && !isHQ) {
    COURSE_DEFS.filter((d) => d.cat === '領航課程').forEach((c, i) => {
      if (rnd() < 0.15) return;
      const d = clampDate(addDays(e.hire, 240 + i * 10 + between(0, 8)));
      signRows.push([periodOf(d), e.empNo, e.name, e.dept, e.position, c.name, fmtDate(d)]);
    });
    if (rnd() < 0.7) sit(e, '領航認證考試', addDays(e.hire, 290), 85, skill);
  }
}
signRows.splice(1, signRows.length - 1, ...signRows.slice(1).sort((a, b) => a[6].localeCompare(b[6])));

// ---------- 課程期對照表（gid 1513816467，加盟頁也使用）----------
const PERIODS: { name: string; period: string; date: string }[] = [
  { name: '加盟主開店培訓', period: '加盟第1期', date: '2026/02/10' },
  { name: '加盟店員基礎培訓', period: '加盟第2期', date: '2026/03/17' },
  { name: '加盟主開店培訓', period: '加盟第3期', date: '2026/05/12' },
  { name: '加盟店員基礎培訓', period: '加盟第4期', date: '2026/06/23' },
  { name: '加盟主開店培訓', period: '加盟第5期', date: '2026/08/11' },
  { name: '加盟店員基礎培訓', period: '加盟第6期', date: '2026/09/22' },
  { name: '加盟主開店培訓', period: '加盟第7期', date: '2026/11/10' },
  { name: '加盟店員基礎培訓', period: '加盟第8期', date: '2026/12/08' },
];
const periodMapRows: Rows = [['課程名稱', '期數', '課程日期'], ...PERIODS.map((p) => [p.name, p.period, p.date])];

// ---------- 加盟：報名（gid 1051538313）與成績（gid 1745615764）----------
const enrollRows: Rows = [['門市屬性', '部門名稱', '員工姓名', '課程期數']];
const franchiseExamRows: Rows = [['門市屬性', '部門名稱', '員工姓名', '考試日期', '區域', '分數', '是否合格']];
const franchiseEmps = emps.filter((e) => e.dept.startsWith('加盟-'));
const pastPeriods = PERIODS.filter((p) => new Date(p.date.replace(/\//g, '-')) < new Date('2026-10-19'));
franchiseEmps.forEach((e, idx) => {
  const store = e.dept.replace(/^加盟-/, '');
  const isOwner = e.position === '加盟主';
  const candidates = PERIODS.filter((p) => (isOwner ? p.name === '加盟主開店培訓' : p.name === '加盟店員基礎培訓'));
  const mine = candidates[idx % candidates.length];
  enrollRows.push(['加盟', store, e.name, mine.period]);
  if (pastPeriods.includes(mine)) {
    const base = new Date(mine.date.replace(/\//g, '-'));
    for (const region of ['筆試', '備料區', '製作區', '服務區']) {
      const score = scoreFor(region === '筆試' ? 88 : 84);
      const d = addDays(base, between(1, 6));
      franchiseExamRows.push(['加盟', store, e.name, fmtStamp(d), region, String(score), score >= 80 ? '及格' : '不及格']);
    }
  }
});

// ---------- 對外：依 gid 取得分頁 ----------
const SHEETS: Record<string, Rows> = {
  '873785037': employeeRows,
  '1715386265': examAllRows,
  '22151113': examLatestRows,
  '552384353': signRows,
  '2124489402': [
    COURSE_HEADER,
    ...COURSE_DEFS.map((d) => [d.name, d.cat, String(d.hours), d.pass, d.req, d.prom, d.video, d.desc]),
  ],
  '1513816467': periodMapRows,
  '1745615764': franchiseExamRows,
  '1051538313': enrollRows,
  '593792740': [['門市', '區域'], ...STORES.map((s) => [`UG${s}店`, '直營'])],
};

export function getDemoSheet(gid: string): Rows {
  const rows = SHEETS[gid];
  if (!rows) throw new Error(`虛擬資料沒有 gid=${gid} 的分頁`);
  return rows.map((r) => r.slice());
}
