import { parseCSV, fetchSheet, normalizeDate, cleanStore, detectChannel, normalizeKey } from './sheetData';

export const GID = {
  employee: '873785037',
  courseExamList: '2124489402', // 課程與考試清單（含時數與分數）
  courseSignin: '552384353', // 課程簽到總表（合併單一分頁）
  examAll: '1715386265', // 考試全紀錄（所有歷次）
  examLatest: '22151113', // 最新考試成績
  coursePeriodMap: '1513816467', // 課程期對照表
  storeMap: '593792740', // 門市對照表
};

export interface CourseExamDef {
  rawName: string; // 原始名稱（可能含編號前綴）
  name: string; // 乾淨中文名稱
  category: string; // 課程類別
  hours: number; // 訓練時數 (HR)
  passScore: number; // 及格門檻
  required: string; // 必修說明
  promotion: string; // 晉升條件
  stage: string; // 階段（基礎/匠心/領航 等，從類別或晉升欄推導）
  videoUrl: string; // 影片網址（YouTube 或其他影片連結）
  description: string; // 課程說明
}

export interface EmployeeRow {
  empNo: string;
  name: string;
  gender: '男' | '女' | string;
  dept: string; // 原始部門名稱（含 UG 前綴 或 茶飲營運部）
  store: string; // 清理後門市名稱
  position: string;
  hireDate: string; // yyyy-mm-dd
  leaveDate: string | null;
  status: '在職' | '離職';
  channel: '直營' | '加盟' | '總部';
  isRegular: boolean; // 正職（含店長/組長/儲備幹部/正職）
  isManager: boolean; // 管理職（店長/組長）
}

export interface CourseRecord {
  empNo: string;
  name: string;
  store: string;
  position: string;
  courseName: string; // 乾淨名稱
  period: string;
  signDate: string; // yyyy-mm-dd
}

export interface ExamRecord {
  empNo: string;
  name: string;
  store: string;
  subject: string; // 考試科目（對應 CourseExamDef.name）
  examDate: string; // yyyy-mm-dd（含時間戳記）
  score: number; // 0-100
  passed: boolean;
  passScore: number; // 當時判定用的及格門檻
}

export interface DirectData {
  employees: EmployeeRow[];
  activeEmployees: EmployeeRow[]; // 在職且直營（排除茶飲營運部）
  courses: CourseRecord[]; // 參訓紀錄
  exams: ExamRecord[];
  courseDefs: CourseExamDef[];
  stores: string[];
}

// --- 課程/考試定義 ---
function cleanCourseName(raw: string): string {
  return raw
    .replace(/^[\dA-Za-z]+[\.\-:_\s]+/, '') // 去除前綴編號代碼（如 "1." "A-" "B1:"）
    .replace(/^\d+/, '')
    .trim();
}

async function fetchCourseDefs(): Promise<CourseExamDef[]> {
  const rows = await fetchSheet(GID.courseExamList);
  const defs: CourseExamDef[] = [];
  // 嘗試偵測欄位位置（由於欄位名稱可能多變，採彈性比對）
  const header = rows[0] ?? [];
  const colIdx = (names: string[]): number => {
    for (let i = 0; i < header.length; i++) {
      const h = (header[i] || '').trim();
      if (names.some((n) => h.includes(n))) return i;
    }
    return -1;
  };
  const nameCol = colIdx(['課程名稱', '考試名稱', '名稱']);
  const catCol = colIdx(['課程類別', '類別']);
  const hoursCol = colIdx(['訓練時數', '時數', 'HR']);
  const passCol = colIdx(['及格門檻', '及格分數', '門檻']);
  const reqCol = colIdx(['必修', '是否必修']);
  const promCol = colIdx(['晉升條件', '晉升']);
  const videoCol = colIdx(['教材網址', '教材連結', '教材', '影片網址', '影片連結', 'videoUrl', '影片', 'YouTube', '網址']);
  const descCol = colIdx(['課程說明', '說明', '課程介紹', '介紹', '內容說明']);

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const rawName = (r[nameCol] ?? '').trim();
    if (!rawName) continue;
    const category = (r[catCol] ?? '').trim();
    const hoursRaw = (r[hoursCol] ?? '').trim();
    const hours = parseFloat(hoursRaw) || 0;
    const passRaw = (r[passCol] ?? '').trim();
    let passScore = 85;
    if (passRaw) {
      const m = passRaw.match(/(\d+)/);
      if (m) passScore = parseInt(m[1], 10);
    } else if (category.includes('食安') || rawName.includes('食安')) {
      passScore = 80;
    }
    const required = (r[reqCol] ?? '').trim();
    const promotion = (r[promCol] ?? '').trim();
    const videoUrl = videoCol >= 0 ? (r[videoCol] ?? '').trim() : '';
    const description = descCol >= 0 ? (r[descCol] ?? '').trim() : '';

    // 推導階段
    let stage = '其他';
    const text = `${category} ${rawName} ${promotion}`;
    if (text.includes('基礎') || text.includes('入門')) stage = '基礎';
    else if (text.includes('匠心')) stage = '匠心';
    else if (text.includes('領航') || text.includes('店長')) stage = '領航';
    else if (text.includes('食安')) stage = '基礎';

    defs.push({
      rawName,
      name: cleanCourseName(rawName),
      category,
      hours,
      passScore,
      required,
      promotion,
      stage,
      videoUrl,
      description,
    });
  }
  return defs;
}

// --- 員工 ---
function isRegularPosition(pos: string): boolean {
  const p = pos.trim();
  return p === '店長' || p === '組長' || p === '儲備幹部' || p === '正職' || p === '正職人員';
}

function isManagerPosition(pos: string): boolean {
  const p = pos.trim();
  return p === '店長' || p === '組長';
}

async function fetchEmployees(): Promise<{ employees: EmployeeRow[]; active: EmployeeRow[]; stores: string[] }> {
  const rows = await fetchSheet(GID.employee);
  const employees: EmployeeRow[] = [];
  // 欄位假設：0 員編, 1 姓名, 2 性別, 3 部門, 4 職位, 5 入職日, 6 離職日
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 5) continue;
    const empNo = (r[0] || '').trim();
    const name = (r[1] || '').trim();
    if (!name || !empNo) continue;
    const gender = (r[2] || '').trim();
    const dept = (r[3] || '').trim();
    const position = (r[4] || '').trim();
    const hireDate = normalizeDate((r[5] || '').trim());
    const leaveRaw = (r[6] || '').trim();
    const leaveDate = leaveRaw ? normalizeDate(leaveRaw) : null;
    const status: '在職' | '離職' = leaveDate ? '離職' : '在職';
    const channel = detectChannel(dept, position);
    employees.push({
      empNo,
      name,
      gender,
      dept,
      store: cleanStore(dept),
      position,
      hireDate,
      leaveDate,
      status,
      channel,
      isRegular: isRegularPosition(position),
      isManager: isManagerPosition(position),
    });
  }
  // 在職人員概況：排除茶飲營運部，只計算 UG 店
  const active = employees.filter(
    (e) => e.status === '在職' && e.dept.includes('UG')
  );
  const stores = Array.from(new Set(active.map((e) => e.store))).sort((a, b) => a.localeCompare(b, 'zh'));
  return { employees, active, stores };
}

// --- 課程參訓紀錄（單一簽到總表 gid=552384353）---
async function fetchCourseRecords(defs: CourseExamDef[]): Promise<CourseRecord[]> {
  const out: CourseRecord[] = [];
  const defByRawKey = new Map(defs.map((d) => [normalizeKey(d.rawName), d]));
  const defByCleanKey = new Map(defs.map((d) => [normalizeKey(d.name), d]));

  let rows: string[][];
  try {
    rows = await fetchSheet(GID.courseSignin);
  } catch {
    return [];
  }
  if (rows.length < 2) return [];
  const header = rows[0] ?? [];
  const colIdx = (names: string[]): number => {
    for (let i = 0; i < header.length; i++) {
      const h = normalizeKey(header[i] || '');
      if (names.some((n) => h.includes(n))) return i;
    }
    return -1;
  };
  const nameCol = colIdx(['姓名', '員工姓名']);
  const empNoCol = colIdx(['員編', '員工編號', '工號']);
  const deptCol = colIdx(['部門', '門市', '分店', '店別']);
  const posCol = colIdx(['職位', '職務']);
  const courseCol = colIdx(['課程名稱', '課程']);
  const periodCol = colIdx(['期數', '期別']);
  const dateCol = colIdx(['日期', '簽到日期', '上課日期']);
  if (nameCol < 0 || courseCol < 0) return [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const name = (r[nameCol] || '').trim();
    const rawCourse = (r[courseCol] || '').trim();
    if (!name || !rawCourse) continue;
    const courseKey = normalizeKey(rawCourse);
    const def = defByRawKey.get(courseKey) ?? defByCleanKey.get(normalizeKey(cleanCourseName(rawCourse)));
    const courseName = def?.name ?? cleanCourseName(rawCourse);
    const empNo = empNoCol >= 0 ? (r[empNoCol] || '').trim() : '';
    const dept = deptCol >= 0 ? (r[deptCol] || '').trim() : '';
    const position = posCol >= 0 ? (r[posCol] || '').trim() : '';
    const period = periodCol >= 0 ? (r[periodCol] || '').trim() : '';
    const signDate = dateCol >= 0 ? normalizeDate((r[dateCol] || '').trim()) : '—';
    out.push({
      empNo,
      name,
      store: cleanStore(dept),
      position,
      courseName,
      period: period || '-',
      signDate,
    });
  }
  return out;
}

// --- 考試紀錄（gid=1715386265 考試全紀錄 + gid=22151113 最新考試成績）---
const EXAM_GIDS = [GID.examAll, GID.examLatest];

async function fetchExamRecords(defs: CourseExamDef[]): Promise<ExamRecord[]> {
  const out: ExamRecord[] = [];
  const passByKey = new Map<string, number>();
  for (const d of defs) {
    passByKey.set(normalizeKey(d.name), d.passScore);
    passByKey.set(normalizeKey(d.rawName), d.passScore);
  }
  const defaultPass = (subject: string): number => {
    if (subject.includes('食安')) return 80;
    return 85;
  };
  const matchDef = (subject: string): CourseExamDef | undefined => {
    const s = normalizeKey(subject);
    for (const d of defs) {
      if (normalizeKey(d.name) === s || normalizeKey(d.rawName) === s) return d;
    }
    for (const d of defs) {
      if (s.includes(normalizeKey(d.name)) || normalizeKey(d.name).includes(s)) return d;
    }
    return undefined;
  };

  for (const gid of EXAM_GIDS) {
    let rows: string[][];
    try {
      rows = await fetchSheet(gid);
    } catch {
      continue;
    }
    if (rows.length < 2) continue;
    const header = rows[0] ?? [];
    const colIdx = (names: string[]): number => {
      for (let i = 0; i < header.length; i++) {
        const h = normalizeKey(header[i] || '');
        if (names.some((n) => h.includes(n))) return i;
      }
      return -1;
    };
    const dateCol = colIdx(['考試日期', '測驗日期', '日期']);
    const subjectCol = colIdx(['考試科目', '科目', '測驗名稱', '考試名稱']);
    const scoreCol = colIdx(['分數', '成績', '得分']);
    const fractionCol = colIdx(['得分/滿分', '題數', '得分／滿分']);
    const empNoCol = colIdx(['員編', '員工編號', '工號']);
    const nameCol = colIdx(['姓名', '員工姓名', '名字']);
    const deptCol = colIdx(['部門', '門市', '分店', '店別']);
    if (nameCol < 0 || scoreCol < 0) continue;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const dateRaw = dateCol >= 0 ? (r[dateCol] || '').trim() : '';
      if (dateCol >= 0 && !/^\d{4}[\/\-\.]/.test(dateRaw)) continue;
      const name = (r[nameCol] || '').trim();
      if (!name) continue;
      const subjectRaw = subjectCol >= 0 ? (r[subjectCol] || '').trim() : '測驗';
      const def = matchDef(subjectRaw);
      const subject = def?.name ?? cleanCourseName(subjectRaw);
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
      if (score === null) {
        const s = parseFloat((r[scoreCol] || '').trim());
        if (!Number.isNaN(s)) score = Math.round(s);
      }
      if (score === null || Number.isNaN(score)) continue;
      const passScore = def?.passScore ?? passByKey.get(normalizeKey(subject)) ?? defaultPass(subject);
      const passed = score >= passScore;
      out.push({
        empNo: empNoCol >= 0 ? (r[empNoCol] || '').trim() : '',
        name,
        store: cleanStore(deptCol >= 0 ? (r[deptCol] || '').trim() : ''),
        subject,
        examDate: normalizeDate(dateRaw),
        score,
        passed,
        passScore,
      });
    }
  }
  // 去重：同一人同一科目同一日期同一分數只保留一筆
  const seen = new Set<string>();
  return out.filter((e) => {
    const key = `${e.name}|${e.subject}|${e.examDate}|${e.score}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchDirectData(): Promise<DirectData> {
  const defs = await fetchCourseDefs();
  const [{ employees, active, stores }, courses, exams] = await Promise.all([
    fetchEmployees(),
    fetchCourseRecords(defs),
    fetchExamRecords(defs),
  ]);
  return {
    employees,
    activeEmployees: active,
    courses,
    exams,
    courseDefs: defs,
    stores,
  };
}

// --- 線上訓練平台：僅載入課程定義（含影片網址）---
export async function fetchTrainingCourses(): Promise<CourseExamDef[]> {
  return fetchCourseDefs();
}

// --- 輔助：食安完課日期（無簽到表，以考試時間戳記為準）---
export function getFoodSafetyCourseDate(name: string, exams: ExamRecord[]): string | null {
  const nk = normalizeKey(name);
  const foodExams = exams
    .filter((e) => normalizeKey(e.name) === nk && (e.subject.includes('食安') || e.subject.includes('食品安全')))
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  return foodExams.length > 0 ? foodExams[0].examDate : null;
}

// --- 輔助：比對學員是否完成某課程（含食安特殊規則）---
export function hasCompletedCourse(
  name: string,
  courseName: string,
  courses: CourseRecord[],
  exams: ExamRecord[]
): boolean {
  const nk = normalizeKey(name);
  const ck = normalizeKey(courseName);
  // 食安特殊規則：只要有考試紀錄即視為完課
  if (ck.includes('食安') || ck.includes('食品安全')) {
    return exams.some((e) => normalizeKey(e.name) === nk && (e.subject.includes('食安') || e.subject.includes('食品安全')));
  }
  return courses.some((c) => normalizeKey(c.name) === nk && normalizeKey(c.courseName) === ck);
}

// --- 輔助：比對學員是否通過某科目測驗 ---
export function hasPassedExam(name: string, subject: string, exams: ExamRecord[]): boolean {
  const nk = normalizeKey(name);
  const sk = normalizeKey(subject);
  return exams.some(
    (e) => normalizeKey(e.name) === nk && (normalizeKey(e.subject) === sk || e.subject.includes(subject) || subject.includes(e.subject)) && e.passed
  );
}

// --- 輔助：動態晉升建議 ---
export interface PromotionAdvice {
  name: string;
  store: string;
  position: string;
  type: 'promote_to_leader' | 'promote_to_manager' | 'incomplete_basic' | 'suggest_advanced';
  message: string;
}

export function buildPromotionAdvice(
  emp: EmployeeRow,
  defs: CourseExamDef[],
  courses: CourseRecord[],
  exams: ExamRecord[]
): PromotionAdvice[] {
  const advices: PromotionAdvice[] = [];
  const byStage = new Map<string, CourseExamDef[]>();
  for (const d of defs) {
    const arr = byStage.get(d.stage) ?? [];
    arr.push(d);
    byStage.set(d.stage, arr);
  }
  const basicDefs = byStage.get('基礎') ?? [];
  const artisanDefs = byStage.get('匠心') ?? [];
  const leaderDefs = byStage.get('領航') ?? [];

  const completedAll = (list: CourseExamDef[]): boolean =>
    list.every((d) => hasCompletedCourse(emp.name, d.name, courses, exams) && hasPassedExam(emp.name, d.name, exams));

  const completedCourseAll = (list: CourseExamDef[]): boolean =>
    list.every((d) => hasCompletedCourse(emp.name, d.name, courses, exams));

  const pos = emp.position;

  if (pos === '正職' || pos === '正職人員' || pos === '儲備幹部') {
    const basicDone = completedAll(basicDefs);
    const artisanDone = completedAll(artisanDefs);
    if (basicDone && artisanDone) {
      advices.push({
        name: emp.name,
        store: emp.store,
        position: pos,
        type: 'promote_to_leader',
        message: '建議晉升組長',
      });
    } else if (basicDone) {
      advices.push({
        name: emp.name,
        store: emp.store,
        position: pos,
        type: 'suggest_advanced',
        message: '建議參與匠心之章課程，以利晉升',
      });
    } else {
      const incomplete = basicDefs.filter((d) => !hasCompletedCourse(emp.name, d.name, courses, exams));
      if (incomplete.length > 0) {
        advices.push({
          name: emp.name,
          store: emp.store,
          position: pos,
          type: 'incomplete_basic',
          message: `${incomplete.map((d) => d.name).join('、')}課程尚未完成，請盡速完成`,
        });
      }
    }
  } else if (pos === '組長') {
    const leaderDone = completedAll(leaderDefs);
    if (leaderDone) {
      advices.push({
        name: emp.name,
        store: emp.store,
        position: pos,
        type: 'promote_to_manager',
        message: '建議晉升店長',
      });
    }
  }

  return advices;
}
