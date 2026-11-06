import { USE_DEMO_DATA } from './config';
import { getDemoSheet } from './demoData';
import { callApi, getToken, getRole } from './api';
import { filterCourseRows } from './courseAccess';

export interface SheetStudent {
  id: string;
  empNo: string;
  name: string;
  store: string;
  position: string;
  channel: '直營' | '加盟' | '總部';
  hireDate: string;
  leaveDate: string | null;
  status: '在職' | '離職';
  avatarColor: string;
  examCount: number;
  courseCount: number;
  bestScore: number;
  avgScore: number;
  passRate: number;
  lastExamDate: string;
}

export interface SheetExam {
  id: string;
  studentId: string;
  examName: string;
  examDate: string;
  score: number;
  passed: boolean;
  attempt: number;
}

export interface SheetCourseRecord {
  id: string;
  studentId: string;
  courseName: string;
  period: string;
  courseDate: string;
  source: '課程';
}

export interface FranchiseExamRow {
  store: string;
  name: string;
  examDate: string;
  region: string;
  score: number;
  passed: boolean;
}

export interface FranchiseEnrollRow {
  store: string;
  name: string;
  period: string;
  courseName: string;
  courseDate: string;
}

export interface FranchiseData {
  kpis: import('../types').Kpi[];
  stores: string[];
  periods: string[];
  exams: FranchiseExamRow[];
  enrolls: FranchiseEnrollRow[];
  courseSessions: { courseName: string; period: string; courseDate: string; enrolled: number }[];
}

export interface SheetData {
  students: SheetStudent[];
  exams: SheetExam[];
  courses: SheetCourseRecord[];
  totalExamRecords: number;
  totalCourseRecords: number;
  averageScore: number;
  passRate: number;
  stores: { store: string; count: number; avgScore: number }[];
  positions: { position: string; count: number; avgScore: number }[];
}

const GID = {
  employee: '873785037',
  examAll: '1715386265', // 考試全紀錄
  examLatest: '22151113', // 最新考試成績
  courseSignin: '552384353', // 課程簽到總表
  courseExamList: '2124489402', // 課程與考試清單
  coursePeriodMap: '1513816467', // 課程期對照表
  storeMap: '593792740', // 門市對照表
  franchiseExam: '1745615764',
  franchiseEnroll: '1051538313',
  franchiseCourseMap: '1513816467',
};

const AVATAR_COLORS = ['bg-mint-500', 'bg-forest-500', 'bg-mint-600', 'bg-forest-600'];

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch !== '\r') {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// --- 基礎 HTTP 快取：以 gid 為 key 快取 CSV 原始回應 ---
const sheetCache = new Map<string, { rows: string[][]; ts: number }>();
const SHEET_TTL_MS = 60_000; // 60 秒內重複請求同一分頁直接用快取

export async function fetchSheet(gid: string): Promise<string[][]> {
  // 預覽模式：回傳內建虛擬資料（切換請改 src/data/config.ts）
  if (USE_DEMO_DATA) {
    await new Promise((r) => setTimeout(r, 250)); // 模擬載入時間
    const demo = getDemoSheet(gid);
    return gid === '2124489402' ? filterCourseRows(demo, getRole()) : demo;
  }
  const cached = sheetCache.get(gid);
  if (cached && Date.now() - cached.ts < SHEET_TTL_MS) {
    return cached.rows.map((r) => r.slice());
  }
  // 由 Apps Script 後端驗證登入憑證與頁面權限後才回傳資料
  const res = await callApi<{ rows: string[][] }>({ action: 'sheet', token: getToken(), gid });
  sheetCache.set(gid, { rows: res.rows, ts: Date.now() });
  return res.rows.map((r) => r.slice());
}

// 強制清除 HTTP 快取（供「更新數據」按鈕使用）
export function clearSheetCache(): void {
  sheetCache.clear();
}

export function normalizeDate(s: string): string {
  if (!s) return '—';
  const m = s.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return s;
}

export function cleanStore(dept: string): string {
  if (!dept) return '—';
  return dept.replace(/^UG/, '').replace(/店$/, '') || dept;
}

// 全面字串清理：移除前後空白、全形空格（U+3000）、半形空格、零寬字元
export function normalizeKey(s: string): string {
  if (!s) return '';
  return s
    .replace(/\u3000/g, '') // 全形空格
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '') // 零寬字元
    .replace(/\s+/g, '') // 所有半形空白
    .trim();
}

export function detectChannel(dept: string, position: string): '直營' | '加盟' | '總部' {
  if (dept.includes('加盟') || position === '加盟主') return '加盟';
  if (dept.includes('營運部') || dept.includes('茶飲營運')) return '總部';
  return '直營';
}

interface RawEmployee {
  empNo: string;
  name: string;
  gender: string;
  dept: string;
  position: string;
  hireDate: string;
  leaveDate: string | null;
}

interface RawExam {
  empNo: string;
  name: string;
  dept: string;
  examDate: string;
  subject: string;
  score: number;
  passed: boolean;
}

interface RawCourse {
  empNo: string;
  name: string;
  dept: string;
  position: string;
  signDate: string;
  courseName: string;
  period: string;
}

// 彈性欄位偵測：在表頭中找尋包含任一關鍵字的欄位
function detectColumns(header: string[], mappings: { key: string; names: string[] }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const { key, names } of mappings) {
    result[key] = -1;
    for (let i = 0; i < header.length; i++) {
      const h = normalizeKey(header[i] || '');
      if (names.some((n) => h.includes(n))) {
        result[key] = i;
        break;
      }
    }
  }
  return result;
}

function looksLikeDate(s: string): boolean {
  return /^\d{4}[\/\-\.]/.test(s.trim());
}

// 考試分頁：gid=1715386265（考試全紀錄）+ gid=22151113（最新考試成績）
const EXAM_GIDS = [GID.examAll, GID.examLatest];

function parseExamSheet(
  rows: string[][],
  passScoreBySubject: Map<string, number>,
  out: Map<string, RawExam[]>,
  stats: { totalScore: number; totalPassed: number; totalExamCount: number }
) {
  if (rows.length < 2) return;
  const header = rows[0] ?? [];
  const cols = detectColumns(header, [
    { key: 'date', names: ['考試日期', '測驗日期', '日期'] },
    { key: 'subject', names: ['考試科目', '科目', '測驗名稱', '考試名稱'] },
    { key: 'score', names: ['分數', '成績', '得分'] },
    { key: 'fraction', names: ['得分/滿分', '題數', '得分／滿分'] },
    { key: 'empNo', names: ['員編', '員工編號', '工號'] },
    { key: 'name', names: ['姓名', '員工姓名', '名字'] },
    { key: 'dept', names: ['部門', '門市', '分店', '店別'] },
    { key: 'position', names: ['職位', '職務'] },
  ]);
  const { date: dateCol, subject: subjectCol, score: scoreCol, fraction: fractionCol,
    empNo: empNoCol, name: nameCol, dept: deptCol, position: positionCol } = cols;
  if (nameCol < 0 || scoreCol < 0) return;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const dateRaw = (r[dateCol] || '').trim();
    if (dateCol >= 0 && !looksLikeDate(dateRaw)) continue;
    const name = normalizeKey((r[nameCol] || ''));
    if (!name) continue;

    let score: number | null = null;
    if (fractionCol >= 0) {
      const frac = (r[fractionCol] || '').trim();
      const m = frac.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      if (m) {
        const got = parseFloat(m[1]);
        const total = parseFloat(m[2]);
        if (total > 0) score = Math.round((got / total) * 100);
      }
    }
    if (score === null && scoreCol >= 0) {
      const s = parseFloat((r[scoreCol] || '').trim());
      if (!Number.isNaN(s)) score = Math.round(s);
    }
    if (score === null || Number.isNaN(score)) continue;

    const subjectRaw = subjectCol >= 0 ? (r[subjectCol] || '').trim() : '測驗';
    const subjectKey = normalizeKey(subjectRaw);
    const passScore = passScoreBySubject.get(subjectKey) ?? (subjectKey.includes('食安') ? 80 : 85);
    const passed = score >= passScore;

    const raw: RawExam = {
      empNo: empNoCol >= 0 ? (r[empNoCol] || '').trim() : '',
      name,
      dept: deptCol >= 0 ? (r[deptCol] || '').trim() : '',
      examDate: dateCol >= 0 ? dateRaw : '',
      subject: subjectRaw || '測驗',
      score,
      passed,
    };
    const arr = out.get(name) ?? [];
    arr.push(raw);
    out.set(name, arr);
    stats.totalScore += score;
    if (passed) stats.totalPassed++;
    stats.totalExamCount++;
  }
}

// 課程簽到總表：gid=552384353
function parseCourseSheet(rows: string[][], out: Map<string, RawCourse[]>) {
  if (rows.length < 2) return;
  const header = rows[0] ?? [];
  const cols = detectColumns(header, [
    { key: 'name', names: ['姓名', '員工姓名'] },
    { key: 'period', names: ['期數', '期別'] },
    { key: 'position', names: ['職位', '職務'] },
    { key: 'empNo', names: ['員編', '員工編號', '工號'] },
    { key: 'dept', names: ['部門', '門市', '分店', '店別'] },
    { key: 'courseName', names: ['課程名稱', '課程'] },
    { key: 'date', names: ['日期', '簽到日期', '上課日期'] },
  ]);
  const { name: nameCol, period: periodCol, position: posCol, empNo: empNoCol,
    dept: deptCol, courseName: courseCol, date: dateCol } = cols;
  if (nameCol < 0 || courseCol < 0) return;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const name = normalizeKey((r[nameCol] || ''));
    const rawCourse = (r[courseCol] || '').trim();
    if (!name || !rawCourse) continue;
    const raw: RawCourse = {
      empNo: empNoCol >= 0 ? (r[empNoCol] || '').trim() : '',
      name,
      dept: deptCol >= 0 ? (r[deptCol] || '').trim() : '',
      position: posCol >= 0 ? (r[posCol] || '').trim() : '',
      signDate: dateCol >= 0 ? (r[dateCol] || '').trim() : '',
      courseName: rawCourse,
      period: periodCol >= 0 ? (r[periodCol] || '').trim() : '',
    };
    const arr = out.get(name) ?? [];
    arr.push(raw);
    out.set(name, arr);
  }
}

export async function fetchSheetData(): Promise<SheetData> {
  // 先讀取課程與考試清單（gid=2124489402）以取得及格門檻
  const [defRows, ...examSheetResults] = await Promise.all([
    fetchSheet(GID.courseExamList),
    ...EXAM_GIDS.map((g) => fetchSheet(g)),
  ]);
  const [courseSheetResult, empRows] = await Promise.all([
    fetchSheet(GID.courseSignin),
    fetchSheet(GID.employee),
  ]);

  // 從課程與考試清單建立及格門檻對照表（以 normalizeKey 為 key）
  const passScoreBySubject = new Map<string, number>();
  {
    const header = defRows[0] ?? [];
    const colIdx = (names: string[]): number => {
      for (let i = 0; i < header.length; i++) {
        const h = normalizeKey(header[i] || '');
        if (names.some((n) => h.includes(n))) return i;
      }
      return -1;
    };
    const nameCol = colIdx(['課程名稱', '考試名稱', '名稱']);
    const passCol = colIdx(['及格門檻', '及格分數', '門檻']);
    const catCol = colIdx(['課程類別', '類別']);
    for (let i = 1; i < defRows.length; i++) {
      const r = defRows[i];
      if (!r) continue;
      const rawName = (r[nameCol] ?? '').trim();
      if (!rawName) continue;
      const passRaw = (r[passCol] ?? '').trim();
      let passScore = 85;
      if (passRaw) {
        const m = passRaw.match(/(\d+)/);
        if (m) passScore = parseInt(m[1], 10);
      } else {
        const cat = (r[catCol] ?? '').trim();
        if (cat.includes('食安') || rawName.includes('食安')) passScore = 80;
      }
      passScoreBySubject.set(normalizeKey(rawName), passScore);
    }
  }

  // Parse employee master
  const empMap = new Map<string, RawEmployee>();
  const empByName = new Map<string, RawEmployee[]>();
  for (let i = 1; i < empRows.length; i++) {
    const r = empRows[i];
    if (!r || r.length < 7) continue;
    const empNo = (r[0] || '').trim();
    const name = (r[1] || '').trim();
    if (!name || !empNo) continue;
    const leaveRaw = (r[6] || '').trim();
    const emp: RawEmployee = {
      empNo,
      name,
      gender: (r[2] || '').trim(),
      dept: (r[3] || '').trim(),
      position: (r[4] || '').trim(),
      hireDate: (r[5] || '').trim(),
      leaveDate: leaveRaw ? leaveRaw : null,
    };
    if (!empMap.has(empNo)) empMap.set(empNo, emp);
    const arr = empByName.get(normalizeKey(name)) ?? [];
    arr.push(emp);
    empByName.set(normalizeKey(name), arr);
  }

  // Parse all exam sheets
  const examsByName = new Map<string, RawExam[]>();
  const examStats = { totalScore: 0, totalPassed: 0, totalExamCount: 0 };
  examSheetResults.forEach((rows) => {
    parseExamSheet(rows, passScoreBySubject, examsByName, examStats);
  });

  // Parse course signin sheet
  const coursesByName = new Map<string, RawCourse[]>();
  parseCourseSheet(courseSheetResult, coursesByName);

  // Build master student list (用 normalizeKey 做比對)
  const seenNames = new Set<string>();
  const students: SheetStudent[] = [];
  const exams: SheetExam[] = [];
  const courses: SheetCourseRecord[] = [];
  let sid = 0;

  const allEmps: RawEmployee[] = [];
  empByName.forEach((arr) => {
    const active = arr.find((e) => !e.leaveDate) ?? arr[0];
    allEmps.push(active);
  });
  allEmps.sort((a, b) => a.name.localeCompare(b.name, 'zh'));

  const extraNames = new Set<string>();
  examsByName.forEach((_, name) => {
    if (!empByName.has(name)) extraNames.add(name);
  });
  coursesByName.forEach((_, name) => {
    if (!empByName.has(name)) extraNames.add(name);
  });

  const allNames = allEmps.map((e) => e.name).concat(Array.from(extraNames).sort());

  for (const name of allNames) {
    const nameKey = normalizeKey(name);
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);
    sid++;
    const id = `st${sid}`;

    let emp: RawEmployee | undefined;
    const empArr = empByName.get(nameKey);
    if (empArr) {
      emp = empArr.find((e) => !e.leaveDate) ?? empArr[0];
    }

    const examsForName = examsByName.get(nameKey) ?? [];
    const coursesForName = coursesByName.get(nameKey) ?? [];

    const store = emp ? cleanStore(emp.dept) : (examsForName[0]?.dept || coursesForName[0]?.dept || '—');
    const position = emp?.position || coursesForName.find((c) => c.position)?.position || '—';
    const channel = emp ? detectChannel(emp.dept, emp.position) : '直營';
    const hireDate = emp ? normalizeDate(emp.hireDate) : '—';
    const leaveDate = emp?.leaveDate ? normalizeDate(emp.leaveDate) : null;
    const status: '在職' | '離職' = leaveDate ? '離職' : '在職';

    const scores = examsForName.map((e) => e.score);
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
    const passedCount = examsForName.filter((e) => e.passed).length;
    const passRate = scores.length > 0 ? Math.round((passedCount / scores.length) * 100) : 0;
    const sortedExams = examsForName.slice().sort((a, b) => a.examDate.localeCompare(b.examDate));
    const lastExamDate = sortedExams.length > 0 ? normalizeDate(sortedExams[sortedExams.length - 1].examDate) : '—';

    students.push({
      id,
      empNo: emp?.empNo || '—',
      name,
      store,
      position,
      channel,
      hireDate,
      leaveDate,
      status,
      avatarColor: AVATAR_COLORS[sid % AVATAR_COLORS.length],
      examCount: examsForName.length,
      courseCount: coursesForName.length,
      bestScore,
      avgScore,
      passRate,
      lastExamDate,
    });

    sortedExams.forEach((e, idx) => {
      exams.push({
        id: `${id}_e${idx + 1}`,
        studentId: id,
        examName: e.subject,
        examDate: normalizeDate(e.examDate),
        score: e.score,
        passed: e.passed,
        attempt: idx + 1,
      });
    });

    const seenCourses = new Set<string>();
    const sortedCourses = coursesForName.slice().sort((a, b) => a.signDate.localeCompare(b.signDate));
    sortedCourses.forEach((c, idx) => {
      const key = `${c.courseName}|${c.period}|${c.signDate}`;
      if (seenCourses.has(key)) return;
      seenCourses.add(key);
      courses.push({
        id: `${id}_c${idx + 1}`,
        studentId: id,
        courseName: c.courseName || '—',
        period: c.period || '—',
        courseDate: normalizeDate(c.signDate),
        source: '課程',
      });
    });
  }

  const averageScore = examStats.totalExamCount > 0 ? Math.round(examStats.totalScore / examStats.totalExamCount) : 0;
  const passRate = examStats.totalExamCount > 0 ? Math.round((examStats.totalPassed / examStats.totalExamCount) * 100) : 0;

  const storeMap = new Map<string, { count: number; total: number }>();
  const posMap = new Map<string, { count: number; total: number }>();
  examsByName.forEach((arr) => {
    arr.forEach((e) => {
      const store = e.dept || '—';
      const sv = storeMap.get(store) ?? { count: 0, total: 0 };
      sv.count++;
      sv.total += e.score;
      storeMap.set(store, sv);
    });
  });
  students.forEach((s) => {
    if (s.position !== '—') {
      const pv = posMap.get(s.position) ?? { count: 0, total: 0 };
      pv.count++;
      posMap.set(s.position, pv);
    }
  });
  const stores = Array.from(storeMap.entries())
    .map(([store, v]) => ({ store, count: v.count, avgScore: Math.round(v.total / v.count) }))
    .sort((a, b) => b.count - a.count);
  const positions = Array.from(posMap.entries())
    .map(([position, v]) => ({ position, count: v.count, avgScore: 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    students,
    exams,
    courses,
    totalExamRecords: examStats.totalExamCount,
    totalCourseRecords: courses.length,
    averageScore,
    passRate,
    stores,
    positions,
  };
}

// 加盟儀表板專屬資料：從三個分頁彙整 KPI 與可搜尋的測驗/課程紀錄
export async function fetchFranchiseData(): Promise<FranchiseData> {
  const [examRows, enrollRows, courseMapRows] = await Promise.all([
    fetchSheet(GID.franchiseExam),
    fetchSheet(GID.franchiseEnroll),
    fetchSheet(GID.franchiseCourseMap),
  ]);

  // 課程名稱＋期數 → 課程日期
  const courseDateByPeriod = new Map<string, string>();
  const courseNameByPeriod = new Map<string, string>();
  for (let i = 1; i < courseMapRows.length; i++) {
    const r = courseMapRows[i];
    if (!r) continue;
    const courseName = (r[0] || '').trim();
    const period = (r[1] || '').trim();
    const date = (r[2] || '').trim();
    if (courseName && period) {
      courseDateByPeriod.set(period, date);
      courseNameByPeriod.set(period, courseName);
    }
  }

  // 成績分頁：門市屬性,部門名稱,員工姓名,考試日期,區域,分數,是否合格
  const exams: FranchiseExamRow[] = [];
  const regionStats = new Map<string, { total: number; count: number }>();
  let totalScore = 0;
  let passedCount = 0;
  let examCount = 0;
  const uniqueExamPeople = new Set<string>();
  const uniqueExamStores = new Set<string>();
  for (let i = 1; i < examRows.length; i++) {
    const r = examRows[i];
    if (!r) continue;
    const scoreRaw = (r[5] || '').trim();
    const s = parseFloat(scoreRaw);
    if (Number.isNaN(s)) continue;
    const store = (r[1] || '').trim();
    const name = (r[2] || '').trim();
    const examDate = (r[3] || '').trim();
    const region = (r[4] || '').trim() || '未分類';
    const passRaw = (r[6] || '').trim();
    let passed: boolean;
    if (passRaw === '及格' || passRaw === '合格' || passRaw === 'V' || passRaw === 'TRUE' || passRaw === 'true') {
      passed = true;
    } else if (passRaw === '不及格' || passRaw === '不合格' || passRaw === 'X' || passRaw === 'FALSE' || passRaw === 'false') {
      passed = false;
    } else {
      passed = s >= 80;
    }
    exams.push({ store, name, examDate, region, score: s, passed });
    if (name) uniqueExamPeople.add(name);
    if (store) uniqueExamStores.add(store);
    totalScore += s;
    examCount++;
    if (passed) passedCount++;
    const rs = regionStats.get(region) ?? { total: 0, count: 0 };
    rs.total += s;
    rs.count++;
    regionStats.set(region, rs);
  }

  // 報名分頁：門市屬性,部門名稱,員工姓名,課程期數
  const enrolls: FranchiseEnrollRow[] = [];
  const uniqueEnrollPeople = new Set<string>();
  const uniqueEnrollStores = new Set<string>();
  const enrollByPeriod = new Map<string, number>();
  for (let i = 1; i < enrollRows.length; i++) {
    const r = enrollRows[i];
    if (!r) continue;
    const store = (r[1] || '').trim();
    const name = (r[2] || '').trim();
    const period = (r[3] || '').trim();
    if (!name || !period) continue;
    enrolls.push({
      store,
      name,
      period,
      courseName: courseNameByPeriod.get(period) ?? '—',
      courseDate: courseDateByPeriod.get(period) ?? '—',
    });
    uniqueEnrollPeople.add(name);
    if (store) uniqueEnrollStores.add(store);
    enrollByPeriod.set(period, (enrollByPeriod.get(period) ?? 0) + 1);
  }

  // 課程場次（依 courseMap）
  const courseSessions = courseNameByPeriod.size
    ? Array.from(courseNameByPeriod.entries()).map(([period, courseName]) => ({
        courseName,
        period,
        courseDate: courseDateByPeriod.get(period) ?? '—',
        enrolled: enrollByPeriod.get(period) ?? 0,
      }))
    : [];

  // 已完成課程期數：courseDate 在今天之前
  const today = new Date('2026-10-19');
  const completedPeriods = courseSessions.filter((s) => {
    const m = s.courseDate.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (!m) return false;
    const d = new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`);
    return d < today;
  }).length;

  const avgScore = examCount > 0 ? Math.round(totalScore / examCount) : 0;
  const passRate = examCount > 0 ? Math.round((passedCount / examCount) * 100) : 0;
  const totalPeople = new Set([...uniqueExamPeople, ...uniqueEnrollPeople]).size;
  const totalStores = new Set([...uniqueExamStores, ...uniqueEnrollStores]).size;

  const regionAvg = (region: string): number => {
    const v = regionStats.get(region);
    return v && v.count > 0 ? Math.round(v.total / v.count) : 0;
  };

  const kpis: import('../types').Kpi[] = [
    { id: 'f1', label: '已完成課程期數', value: `${completedPeriods}`, unit: '期', delta: '', trend: 'up', icon: 'book' },
    { id: 'f2', label: '加盟培訓店數', value: `${totalStores}`, unit: '店', delta: '', trend: 'up', icon: 'users' },
    { id: 'f3', label: '加盟培訓人數', value: totalPeople.toLocaleString(), unit: '人', delta: '', trend: 'up', icon: 'users' },
    { id: 'f4', label: '測驗及格率', value: `${passRate}`, unit: '%', delta: '', trend: passRate >= 80 ? 'up' : 'down', icon: 'check' },
    { id: 'f5', label: '筆試平均分數', value: `${regionAvg('筆試')}`, unit: '分', delta: '', trend: 'up', icon: 'star' },
    { id: 'f6', label: '備料區平均分數', value: `${regionAvg('備料區')}`, unit: '分', delta: '', trend: 'up', icon: 'star' },
    { id: 'f7', label: '製作區平均分數', value: `${regionAvg('製作區')}`, unit: '分', delta: '', trend: 'up', icon: 'star' },
    { id: 'f8', label: '服務區平均分數', value: `${regionAvg('服務區')}`, unit: '分', delta: '', trend: 'up', icon: 'star' },
  ];

  const stores = Array.from(
    new Set([...exams.map((e) => e.store), ...enrolls.map((e) => e.store)].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'zh'));
  const periods = Array.from(courseNameByPeriod.keys()).sort((a, b) => a.localeCompare(b, 'zh'));

  return {
    kpis,
    stores,
    periods,
    exams,
    enrolls,
    courseSessions,
  };
}
