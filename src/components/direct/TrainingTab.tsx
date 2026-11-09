import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Users,
  Store,
  TrendingUp,
  BarChart3,
  Hash,
} from 'lucide-react';
import {
  type DirectData,
  type EmployeeRow,
  type CourseRecord,
  type ExamRecord,
  type CourseExamDef,
  buildPromotionAdvice,
  hasCompletedCourse,
  type PromotionAdvice,
} from '../../data/directData';
import { normalizeKey } from '../../data/sheetData';

interface Props {
  data: DirectData;
}

export default function TrainingTab({ data }: Props) {
  const { activeEmployees, courses, exams, courseDefs } = data;

  // 培訓概況僅計算正職人員
  const regularEmps = useMemo(
    () => activeEmployees.filter((e) => e.isRegular),
    [activeEmployees]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PromotionSection
        regularEmps={regularEmps}
        defs={courseDefs}
        courses={courses}
        exams={exams}
      />
      <CoursesSection
        regularEmps={regularEmps}
        defs={courseDefs}
        courses={courses}
        exams={exams}
      />
      <ExamsSection
        regularEmps={regularEmps}
        defs={courseDefs}
        exams={exams}
        courses={courses}
      />
      <StatisticsSection
        employees={activeEmployees}
        defs={courseDefs}
        courses={courses}
      />
    </div>
  );
}

/* ========== 一、建議區 ========== */

// 課程層級：2=店長課程、1=組長課程、0=一般正職課程
function courseLevel(d: { category: string; rawName: string; name: string }): number {
  const cat = d.category || '';
  if (cat.includes('店長')) return 2;
  if (cat.includes('組長')) return 1;
  const t = `${cat}${d.rawName}${d.name}`;
  if (t.includes('領航')) return 2;
  if (t.includes('匠心')) return 1;
  return 0;
}
// 員工職位層級：店長 2、組長 1、其餘正職 0
function empLevel(e: { position: string }): number {
  if (e.position.includes('店長')) return 2;
  if (e.position.includes('組長')) return 1;
  return 0;
}

function PromotionSection({
  regularEmps,
  defs,
  courses,
  exams,
}: {
  regularEmps: EmployeeRow[];
  defs: DirectData['courseDefs'];
  courses: CourseRecord[];
  exams: ExamRecord[];
}) {
  const advices = useMemo<PromotionAdvice[]>(() => {
    const out: PromotionAdvice[] = [];
    for (const emp of regularEmps) {
      out.push(...buildPromotionAdvice(emp, defs, courses, exams));
    }
    return out;
  }, [regularEmps, defs, courses, exams]);

  const grouped = useMemo(() => {
    const g: Record<string, PromotionAdvice[]> = {
      promote_to_leader: [],
      promote_to_manager: [],
      incomplete_basic: [],
      suggest_advanced: [],
    };
    for (const a of advices) g[a.type].push(a);
    return g;
  }, [advices]);

  const groups = [
    { type: 'promote_to_leader' as const, title: '晉升組長建議', icon: TrendingUp, color: 'mint' },
    { type: 'promote_to_manager' as const, title: '晉升店長建議', icon: TrendingUp, color: 'forest' },
    { type: 'incomplete_basic' as const, title: '基礎未完課提醒', icon: XCircle, color: 'amber' },
    { type: 'suggest_advanced' as const, title: '培訓進修建議', icon: BookOpen, color: 'mint' },
  ];

  return (
    <SectionCard icon={TrendingUp} title="建議區" subtitle="自動比對學員職務與紀錄，輸出動態建議">
      {advices.length === 0 ? (
        <p className="text-sm text-forest-500 py-4 text-center">目前無建議事項</p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const list = grouped[g.type];
            if (list.length === 0) return null;
            const Icon = g.icon;
            const colorClass =
              g.color === 'mint' ? 'bg-mint-50 text-mint-700 border-mint-100' :
              g.color === 'forest' ? 'bg-forest-50 text-forest-700 border-forest-100' :
              'bg-amber-50 text-amber-700 border-amber-100';
            return (
              <div key={g.type}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-forest-600" />
                  <h4 className="text-sm font-semibold text-forest-800">{g.title}</h4>
                  <span className="text-xs text-forest-400">· {list.length} 人</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {list.map((a, i) => (
                    <div key={`${a.name}-${a.type}-${i}`} className={`rounded-xl border p-3 ${colorClass}`}>
                      <p className="font-semibold text-sm">{a.name}</p>
                      <p className="text-xs text-forest-500 mt-0.5">{a.store} · {a.position}</p>
                      <p className="text-sm mt-1.5 font-medium">{a.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

/* ========== 二、課程區 ========== */

// 判斷是否為測驗項目（課程類別含「測驗」或「考試」）
function isExamDef(d: CourseExamDef): boolean {
  return /測驗|考試/.test(d.category);
}

function CoursesSection({
  regularEmps,
  defs,
  courses,
  exams,
}: {
  regularEmps: EmployeeRow[];
  defs: DirectData['courseDefs'];
  courses: CourseRecord[];
  exams: ExamRecord[];
}) {
  const [mode, setMode] = useState<'overview' | 'store' | 'course'>('overview');
  const [storeQuery, setStoreQuery] = useState('');
  const [courseQuery, setCourseQuery] = useState('');

  const stores = useMemo(
    () => Array.from(new Set(regularEmps.map((e) => e.store))).sort((a, b) => a.localeCompare(b, 'zh')),
    [regularEmps]
  );
  // 課程搜尋下拉：僅列出非測驗項目的課程
  const courseNames = useMemo(
    () => defs.filter((d) => !isExamDef(d)).map((d) => d.name).sort((a, b) => a.localeCompare(b, 'zh')),
    [defs]
  );
  const regularNameKeys = useMemo(() => new Set(regularEmps.map((e) => normalizeKey(e.name))), [regularEmps]);
  // 課程定義（排除測驗項目）
  const courseDefs = useMemo(() => defs.filter((d) => !isExamDef(d)), [defs]);

  // 課程總覽
  const overview = useMemo(() => {
    return courseDefs.map((d) => {
      // 依課程對應職位計算應受訓人員：店長課程僅店長、組長課程含組長以上、其餘為全體正職
      const need = courseLevel(d);
      const eligible = regularEmps.filter((emp) => empLevel(emp) >= need);
      const shouldTrain = eligible.length;
      const completed = eligible.filter((emp) =>
        hasCompletedCourse(emp.name, d.name, courses, exams)
      ).length;
      const rate = shouldTrain > 0 ? Math.round((completed / shouldTrain) * 100) : 0;
      return { name: d.name, shouldTrain, completed, rate };
    });
  }, [courseDefs, regularEmps, courses, exams]);

  // 門市搜尋：以人員為主，每位員工僅列一列，列出修課清單
  const storeResults = useMemo(() => {
    if (mode !== 'store' || !storeQuery) return [];
    const storeEmps = regularEmps.filter((e) => e.store === storeQuery);
    const storeEmpNameKeys = new Set(storeEmps.map((e) => normalizeKey(e.name)));
    const records = courses.filter((c) => storeEmpNameKeys.has(normalizeKey(c.name)));
    // 食安（以考試紀錄視為參訓）
    const foodEmpNames = new Set(
      storeEmps
        .filter((e) =>
          exams.some((ex) => normalizeKey(ex.name) === normalizeKey(e.name) && (ex.subject.includes('食安') || ex.subject.includes('食品安全')))
        )
        .map((e) => e.name)
    );

    // 以人員為主分組
    const byEmp = new Map<string, { name: string; courses: { name: string; period: string }[] }>();
    for (const e of storeEmps) {
      byEmp.set(e.name, { name: e.name, courses: [] });
    }
    for (const c of records) {
      const arr = byEmp.get(c.name);
      if (arr) arr.courses.push({ name: c.courseName, period: c.period });
    }
    for (const name of foodEmpNames) {
      const arr = byEmp.get(name);
      if (arr && !arr.courses.some((c) => c.name === '食品安全')) {
        arr.courses.push({ name: '食品安全', period: '—' });
      }
    }
    return Array.from(byEmp.values())
      .filter((r) => r.courses.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  }, [mode, storeQuery, regularEmps, courses, exams]);

  // 課程搜尋：該課程開課的所有期數，每期將門市與員工合併顯示在同一列
  const courseResults = useMemo(() => {
    if (mode !== 'course' || !courseQuery) return [];
    const courseKey = normalizeKey(courseQuery);
    const courseRecords = courses.filter((c) => normalizeKey(c.courseName) === courseKey);
    const byPeriod = new Map<string, { store: string; name: string }[]>();
    for (const c of courseRecords) {
      if (!regularNameKeys.has(normalizeKey(c.name))) continue;
      const arr = byPeriod.get(c.period) ?? [];
      arr.push({ store: c.store, name: c.name });
      byPeriod.set(c.period, arr);
    }
    return Array.from(byPeriod.entries())
      .map(([period, people]) => ({
        period,
        people: people.sort((a, b) => a.store.localeCompare(b.store, 'zh') || a.name.localeCompare(b.name, 'zh')),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [mode, courseQuery, courses, regularNameKeys]);

  return (
    <SectionCard icon={BookOpen} title="課程區" subtitle="各課程應受訓人數、完課率，依門市或課程搜尋">
      {/* 模式切換 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="inline-flex rounded-xl border border-forest-200 overflow-hidden w-fit">
          <ModeBtn active={mode === 'overview'} onClick={() => { setMode('overview'); setStoreQuery(''); setCourseQuery(''); }}>
            課程總覽
          </ModeBtn>
          <ModeBtn active={mode === 'store'} onClick={() => { setMode('store'); setCourseQuery(''); }}>
            門市搜尋
          </ModeBtn>
          <ModeBtn active={mode === 'course'} onClick={() => { setMode('course'); setStoreQuery(''); }}>
            課程搜尋
          </ModeBtn>
        </div>
        {mode === 'store' && (
          <select
            value={storeQuery}
            onChange={(e) => setStoreQuery(e.target.value)}
            className="appearance-none px-3 py-2 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400"
          >
            <option value="">選擇門市</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {mode === 'course' && (
          <select
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            className="appearance-none px-3 py-2 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400"
          >
            <option value="">選擇課程</option>
            {courseNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* 課程總覽 */}
      {mode === 'overview' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-forest-50/40 text-left text-xs text-forest-600">
                <th className="px-4 py-3 font-semibold">課程名稱</th>
                <th className="px-4 py-3 font-semibold text-right">應受訓人數</th>
                <th className="px-4 py-3 font-semibold text-right">已完課人數</th>
                <th className="px-4 py-3 font-semibold text-right">完課率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {overview.map((c) => (
                <tr key={c.name} className="hover:bg-forest-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-forest-900">{c.name}</td>
                  <td className="px-4 py-3 text-right text-forest-800">{c.shouldTrain}</td>
                  <td className="px-4 py-3 text-right text-forest-800">{c.completed}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${c.rate >= 80 ? 'text-mint-700' : c.rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {c.rate}%
                    </span>
                  </td>
                </tr>
              ))}
              {overview.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-forest-500">尚無課程資料</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 門市搜尋結果：以人員為主，每位員工一列 */}
      {mode === 'store' && storeQuery && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-forest-50/40 text-left text-xs text-forest-600">
                <th className="px-4 py-3 font-semibold">姓名</th>
                <th className="px-4 py-3 font-semibold">修課清單</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {storeResults.map((r) => (
                <tr key={r.name} className="hover:bg-forest-50/30 transition-colors align-top">
                  <td className="px-4 py-3 font-medium text-forest-900 whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.courses.map((c, i) => (
                        <span key={`${c.name}-${i}`} className="inline-flex items-center gap-1 text-xs bg-mint-50 border border-mint-100 px-2 py-1 rounded-md text-forest-700">
                          {c.name}
                          {c.period !== '—' && <span className="text-forest-400">· {c.period}</span>}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {storeResults.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-forest-500">尚無參訓紀錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 課程搜尋結果：門市與員工合併顯示在同一列 */}
      {mode === 'course' && courseQuery && (
        <div className="space-y-4">
          {courseResults.map((period) => (
            <div key={period.period} className="rounded-xl border border-forest-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-forest-50/50 border-b border-forest-100 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-forest-500" />
                <span className="text-sm font-semibold text-forest-800">期數 {period.period}</span>
                <span className="text-xs text-forest-400 ml-auto">{period.people.length} 人</span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-forest-50">
                  {period.people.map((p, i) => (
                    <tr key={`${p.store}-${p.name}-${i}`} className="hover:bg-forest-50/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                          <span className="text-forest-700">{p.store}</span>
                          <span className="text-forest-300">·</span>
                          <span className="font-medium text-forest-900">{p.name}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {courseResults.length === 0 && (
            <p className="text-sm text-forest-500 py-8 text-center">尚無開課紀錄</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

/* ========== 三、考試區 ========== */

interface FailedPerson {
  name: string;
  subject: string;
  store: string;
  bestScore: number;
  passScore: number;
}

// 計算每人每科的最高成績，僅回傳最高成績仍未達及格標準者
function bestScoreFailed(exams: ExamRecord[]): FailedPerson[] {
  const best = new Map<string, FailedPerson>();
  for (const e of exams) {
    const key = `${e.name}|${e.subject}`;
    const existing = best.get(key);
    if (!existing || e.score > existing.bestScore) {
      best.set(key, {
        name: e.name,
        subject: e.subject,
        store: e.store,
        bestScore: e.score,
        passScore: e.passScore,
      });
    }
  }
  return Array.from(best.values())
    .filter((p) => p.bestScore < p.passScore)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}

function ExamsSection({
  regularEmps,
  defs,
  exams,
}: {
  regularEmps: EmployeeRow[];
  defs: DirectData['courseDefs'];
  exams: ExamRecord[];
  courses: CourseRecord[];
}) {
  const [mode, setMode] = useState<'overview' | 'subject' | 'store'>('overview');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [storeQuery, setStoreQuery] = useState('');

  const regularNameKeys = useMemo(() => new Set(regularEmps.map((e) => normalizeKey(e.name))), [regularEmps]);
  const regularExams = useMemo(() => exams.filter((e) => regularNameKeys.has(normalizeKey(e.name))), [exams, regularNameKeys]);
  const empStoreMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of regularEmps) m.set(normalizeKey(e.name), e.store);
    return m;
  }, [regularEmps]);
  const stores = useMemo(
    () => Array.from(new Set(regularEmps.map((e) => e.store))).sort((a, b) => a.localeCompare(b, 'zh')),
    [regularEmps]
  );
  // 考試科目下拉：僅列出「課程類別」為測驗項目的課程
  const subjects = useMemo(
    () => defs.filter(isExamDef).map((d) => d.name).sort((a, b) => a.localeCompare(b, 'zh')),
    [defs]
  );

  const passScoreOf = (subject: string): number => {
    const sk = normalizeKey(subject);
    const d = defs.find((x) => normalizeKey(x.name) === sk);
    if (d) return d.passScore;
    if (sk.includes('食安')) return 80;
    return 85;
  };

  // 全門市加總
  const overall = useMemo(() => {
    const total = regularExams.length;
    const passed = regularExams.filter((e) => e.passed).length;
    const avg = total > 0 ? Math.round(regularExams.reduce((s, e) => s + e.score, 0) / total) : 0;
    const uniquePeople = new Set(regularExams.map((e) => e.name)).size;
    const completionRate = regularEmps.length > 0 ? Math.round((uniquePeople / regularEmps.length) * 100) : 0;
    return { totalPeople: uniquePeople, totalExams: total, completionRate, avg, passed };
  }, [regularExams, regularEmps]);

  // 依考試科目：大標列出「門市」，再依該門市統計
  const subjectStoreGroups = useMemo(() => {
    if (mode !== 'subject' || !subjectQuery) return [];
    const scoped = regularExams.filter(
      (e) =>
        normalizeKey(e.subject) === normalizeKey(subjectQuery) ||
        e.subject.includes(subjectQuery) ||
        subjectQuery.includes(e.subject)
    );
    const byStore = new Map<string, ExamRecord[]>();
    for (const e of scoped) {
      const store = empStoreMap.get(normalizeKey(e.name)) ?? e.store;
      const arr = byStore.get(store) ?? [];
      arr.push(e);
      byStore.set(store, arr);
    }
    return Array.from(byStore.entries())
      .map(([store, storeExams]) => {
        const uniquePeople = new Set(storeExams.map((e) => e.name)).size;
        const storeEmpCount = regularEmps.filter((e) => e.store === store).length;
        const completionRate = storeEmpCount > 0 ? Math.round((uniquePeople / storeEmpCount) * 100) : 0;
        const avg = storeExams.length > 0 ? Math.round(storeExams.reduce((s, e) => s + e.score, 0) / storeExams.length) : 0;
        const failed = bestScoreFailed(storeExams);
        return { store, uniquePeople, completionRate, avg, failed };
      })
      .sort((a, b) => a.store.localeCompare(b.store, 'zh'));
  }, [mode, subjectQuery, regularExams, empStoreMap, regularEmps]);

  // 依門市：大標列出「考試科目」，再依該科目統計
  const storeSubjectGroups = useMemo(() => {
    if (mode !== 'store' || !storeQuery) return [];
    const storeEmpNameKeys = new Set(
      regularEmps.filter((e) => e.store === storeQuery).map((e) => normalizeKey(e.name))
    );
    const scoped = regularExams.filter((e) => storeEmpNameKeys.has(normalizeKey(e.name)));
    const bySubject = new Map<string, ExamRecord[]>();
    for (const e of scoped) {
      const arr = bySubject.get(e.subject) ?? [];
      arr.push(e);
      bySubject.set(e.subject, arr);
    }
    return Array.from(bySubject.entries())
      .map(([subject, subjectExams]) => {
        const uniquePeople = new Set(subjectExams.map((e) => e.name)).size;
        const storeEmpCount = storeEmpNameKeys.size;
        const completionRate = storeEmpCount > 0 ? Math.round((uniquePeople / storeEmpCount) * 100) : 0;
        const avg = subjectExams.length > 0 ? Math.round(subjectExams.reduce((s, e) => s + e.score, 0) / subjectExams.length) : 0;
        const failed = bestScoreFailed(subjectExams);
        return { subject, uniquePeople, completionRate, avg, failed };
      })
      .sort((a, b) => a.subject.localeCompare(b.subject, 'zh'));
  }, [mode, storeQuery, regularExams, regularEmps]);

  return (
    <SectionCard icon={Award} title="考試區" subtitle="考試人數、完成率、平均分數，依科目或門市搜尋不及格名單">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="inline-flex rounded-xl border border-forest-200 overflow-hidden w-fit">
          <ModeBtn active={mode === 'overview'} onClick={() => { setMode('overview'); setSubjectQuery(''); setStoreQuery(''); }}>
            全門市加總
          </ModeBtn>
          <ModeBtn active={mode === 'subject'} onClick={() => { setMode('subject'); setStoreQuery(''); }}>
            依考試科目
          </ModeBtn>
          <ModeBtn active={mode === 'store'} onClick={() => { setMode('store'); setSubjectQuery(''); }}>
            依門市
          </ModeBtn>
        </div>
        {mode === 'subject' && (
          <select
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            className="appearance-none px-3 py-2 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400"
          >
            <option value="">選擇科目</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {mode === 'store' && (
          <select
            value={storeQuery}
            onChange={(e) => setStoreQuery(e.target.value)}
            className="appearance-none px-3 py-2 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400"
          >
            <option value="">選擇門市</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* 全門市加總 */}
      {mode === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBox icon={Users} label="總考試人數" value={`${overall.totalPeople}`} unit="人" />
          <StatBox icon={CheckCircle2} label="考試完成率" value={`${overall.completionRate}`} unit="%" />
          <StatBox icon={Award} label="平均分數" value={`${overall.avg}`} unit="分" />
        </div>
      )}

      {/* 依考試科目：大標列出門市 */}
      {mode === 'subject' && subjectQuery && (
        <div className="space-y-4">
          <div className="text-xs text-forest-500 px-1">及格門檻：{passScoreOf(subjectQuery)} 分</div>
          {subjectStoreGroups.map((g) => (
            <div key={g.store} className="rounded-xl border border-forest-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-forest-50/50 border-b border-forest-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-forest-500" />
                <span className="text-sm font-semibold text-forest-800">{g.store}</span>
                <span className="text-xs text-forest-400 ml-auto">{g.uniquePeople} 人</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MiniStat label="考試人數" value={g.uniquePeople} unit="人" />
                  <MiniStat label="完成率" value={g.completionRate} unit="%" />
                  <MiniStat label="平均分數" value={g.avg} unit="分" />
                </div>
                {g.failed.length > 0 && <FailedList items={g.failed} />}
              </div>
            </div>
          ))}
          {subjectStoreGroups.length === 0 && (
            <p className="text-sm text-forest-500 py-8 text-center">尚無考試紀錄</p>
          )}
        </div>
      )}

      {/* 依門市：大標列出考試科目 */}
      {mode === 'store' && storeQuery && (
        <div className="space-y-4">
          {storeSubjectGroups.map((g) => (
            <div key={g.subject} className="rounded-xl border border-forest-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-forest-50/50 border-b border-forest-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-mint-500" />
                <span className="text-sm font-semibold text-forest-800">{g.subject}</span>
                <span className="text-xs text-forest-400 ml-auto">及格門檻 {passScoreOf(g.subject)} 分</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MiniStat label="考試人數" value={g.uniquePeople} unit="人" />
                  <MiniStat label="完成率" value={g.completionRate} unit="%" />
                  <MiniStat label="平均分數" value={g.avg} unit="分" />
                </div>
                {g.failed.length > 0 && <FailedList items={g.failed} />}
              </div>
            </div>
          ))}
          {storeSubjectGroups.length === 0 && (
            <p className="text-sm text-forest-500 py-8 text-center">尚無考試紀錄</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-forest-500">{label}</p>
      <p className="text-lg font-bold text-forest-900">
        {value}<span className="text-xs font-medium text-forest-500 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

function FailedList({ items }: { items: FailedPerson[] }) {
  return (
    <div className="rounded-xl border border-red-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-red-50/60 border-b border-red-100 flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-600" />
        <span className="text-sm font-semibold text-red-700">不及格名單</span>
        <span className="text-xs text-red-400 ml-auto">{items.length} 筆</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-red-50/30 text-left text-xs text-forest-600">
            <th className="px-4 py-2 font-medium">姓名</th>
            <th className="px-4 py-2 font-medium">門市</th>
            <th className="px-4 py-2 font-medium">科目</th>
            <th className="px-4 py-2 font-medium text-right">最高分數</th>
            <th className="px-4 py-2 font-medium text-right">及格門檻</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-forest-50">
          {items.map((f, i) => (
            <tr key={`${f.name}-${f.subject}-${i}`}>
              <td className="px-4 py-2.5 font-medium text-forest-900">{f.name}</td>
              <td className="px-4 py-2.5 text-forest-700">{f.store}</td>
              <td className="px-4 py-2.5 text-forest-700">{f.subject}</td>
              <td className="px-4 py-2.5 text-right font-bold text-red-600">{f.bestScore}</td>
              <td className="px-4 py-2.5 text-right text-forest-600">{f.passScore}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-forest-500">無不及格名單</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ========== 四、統計資料 ========== */

function StatisticsSection({
  employees,
  defs,
  courses,
}: {
  employees: EmployeeRow[];
  defs: DirectData['courseDefs'];
  courses: CourseRecord[];
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<string>('');

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    for (const e of employees) {
      const ym = e.hireDate.match(/^(\d{4})/);
      if (ym) set.add(parseInt(ym[1], 10));
      if (e.leaveDate) {
        const lm = e.leaveDate.match(/^(\d{4})/);
        if (lm) set.add(parseInt(lm[1], 10));
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [employees, currentYear]);

  // 員工人數與訓練總時數：管理職/非管理職 × 男/女
  const stats = useMemo(() => {
    // 該年度曾任職員工（含當年入離職、當年離職者）
    const yearEmployees = employees.filter((e) => {
      const hy = parseInt(e.hireDate.slice(0, 4) || '0', 10);
      const ly = e.leaveDate ? parseInt(e.leaveDate.slice(0, 4) || '0', 10) : null;
      return hy <= year && (ly === null || ly >= year);
    });
    // 季度篩選
    const scoped = quarter
      ? yearEmployees.filter((e) => {
          const q = parseInt(quarter, 10);
          const monthStart = (q - 1) * 3 + 1;
          const monthEnd = q * 3;
          const start = new Date(year, monthStart - 1, 1);
          const end = new Date(year, monthEnd, 0);
          const hd = new Date(e.hireDate);
          const ld = e.leaveDate ? new Date(e.leaveDate) : null;
          // 在該季期間內曾在職
          return hd <= end && (!ld || ld >= start);
        })
      : yearEmployees;

    // 計算每人訓練時數
    const hoursByName = new Map<string, number>();
    for (const c of courses) {
      const d = defs.find((dd) => dd.name === c.courseName);
      if (!d) continue;
      hoursByName.set(c.name, (hoursByName.get(c.name) ?? 0) + d.hours);
    }

    const cell = (isManager: boolean, gender: string) =>
      scoped.filter((e) => e.isManager === isManager && e.gender === gender);

    const managerMale = cell(true, '男');
    const managerFemale = cell(true, '女');
    const nonManagerMale = cell(false, '男');
    const nonManagerFemale = cell(false, '女');

    const peopleCount = {
      managerMale: managerMale.length,
      managerFemale: managerFemale.length,
      nonManagerMale: nonManagerMale.length,
      nonManagerFemale: nonManagerFemale.length,
      total: scoped.length,
    };

    const sumHours = (list: EmployeeRow[]) =>
      list.reduce((s, e) => s + (hoursByName.get(e.name) ?? 0), 0);

    const hours = {
      managerMale: sumHours(managerMale),
      managerFemale: sumHours(managerFemale),
      nonManagerMale: sumHours(nonManagerMale),
      nonManagerFemale: sumHours(nonManagerFemale),
      total: sumHours(scoped),
    };

    return { peopleCount, hours };
  }, [employees, courses, defs, year, quarter]);

  return (
    <SectionCard icon={BarChart3} title="統計資料" subtitle="員工人數與訓練總時數，依管理職/非管理職與性別分類">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div>
          <label className="text-xs text-forest-500 mb-1 block">年度</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="appearance-none px-3 py-2 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400"
          >
            {years.map((y) => <option key={y} value={y}>{y} 年</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-forest-500 mb-1 block">季度</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="appearance-none px-3 py-2 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-mint-400"
          >
            <option value="">全年</option>
            <option value="1">第一季</option>
            <option value="2">第二季</option>
            <option value="3">第三季</option>
            <option value="4">第四季</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-forest-100 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-forest-50/50">
              <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-forest-700 border-r border-forest-100">項目</th>
              <th colSpan={2} className="px-4 py-2 text-center font-semibold text-forest-700 border-r border-forest-100">管理職</th>
              <th colSpan={2} className="px-4 py-2 text-center font-semibold text-forest-700 border-r border-forest-100">非管理職</th>
              <th rowSpan={2} className="px-4 py-3 text-center font-semibold text-forest-700">合計</th>
            </tr>
            <tr className="bg-forest-50/30">
              <th className="px-4 py-2 text-center font-medium text-forest-600 border-r border-forest-50">男性</th>
              <th className="px-4 py-2 text-center font-medium text-forest-600 border-r border-forest-100">女性</th>
              <th className="px-4 py-2 text-center font-medium text-forest-600 border-r border-forest-50">男性</th>
              <th className="px-4 py-2 text-center font-medium text-forest-600">女性</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-50">
            <tr className="hover:bg-forest-50/20 transition-colors">
              <td className="px-4 py-3 font-medium text-forest-900 border-r border-forest-100">員工人數 (人)</td>
              <td className="px-4 py-3 text-center text-forest-800 border-r border-forest-50">{stats.peopleCount.managerMale}</td>
              <td className="px-4 py-3 text-center text-forest-800 border-r border-forest-100">{stats.peopleCount.managerFemale}</td>
              <td className="px-4 py-3 text-center text-forest-800 border-r border-forest-50">{stats.peopleCount.nonManagerMale}</td>
              <td className="px-4 py-3 text-center text-forest-800">{stats.peopleCount.nonManagerFemale}</td>
              <td className="px-4 py-3 text-center font-bold text-forest-900">{stats.peopleCount.total}</td>
            </tr>
            <tr className="hover:bg-forest-50/20 transition-colors">
              <td className="px-4 py-3 font-medium text-forest-900 border-r border-forest-100">訓練總時數 (HR)</td>
              <td className="px-4 py-3 text-center text-forest-800 border-r border-forest-50">{stats.hours.managerMale}</td>
              <td className="px-4 py-3 text-center text-forest-800 border-r border-forest-100">{stats.hours.managerFemale}</td>
              <td className="px-4 py-3 text-center text-forest-800 border-r border-forest-50">{stats.hours.nonManagerMale}</td>
              <td className="px-4 py-3 text-center text-forest-800">{stats.hours.nonManagerFemale}</td>
              <td className="px-4 py-3 text-center font-bold text-forest-900">{stats.hours.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-forest-400 mt-3">
        本區計算時包含當年度曾任職之離職員工（例如查詢 {year} 年，包含 {year} 當年入職且離職、以及 {year} 之前入職並於 {year} 離職者）。
      </p>
    </SectionCard>
  );
}

/* ========== 共用元件 ========== */

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Award;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-forest-50">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">{title}</h3>
        </div>
        {subtitle && <p className="text-xs text-forest-500 mt-1 ml-7">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-mint-500 text-white' : 'bg-white text-forest-700 hover:bg-forest-50'
      }`}
    >
      {children}
    </button>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-forest-50/40 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white text-mint-600 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-forest-500">{label}</p>
        <p className="text-xl font-bold text-forest-900">
          {value}<span className="text-xs font-medium text-forest-500 ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  );
}
