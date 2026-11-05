import { useState, useMemo } from 'react';
import {
  Search,
  Store,
  Briefcase,
  Calendar,
  CalendarOff,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  IdCard,
  TrendingUp,
  Loader2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import {
  fetchSheetData,
  type SheetData,
  type SheetStudent,
  type SheetExam,
  type SheetCourseRecord,
} from '../data/sheetData';
import { fetchDirectData, type DirectData } from '../data/directData';
import { useCachedData } from '../data/swrCache';
import ProgressBar from './ProgressBar';

interface Match {
  student: SheetStudent;
  exams: SheetExam[];
  courses: SheetCourseRecord[];
}

export default function StudentHistoryPage() {
  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [match, setMatch] = useState<Match | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { data, loading, error } = useCachedData<SheetData>('sheet-data', fetchSheetData);
  const { data: direct, loading: directLoading } = useCachedData<DirectData>('direct-data', fetchDirectData);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const q = keyword.trim().toLowerCase();
    setSubmitted(keyword.trim());
    if (!q) {
      setMatch(null);
      setNotFound(false);
      return;
    }
    const student = data.students.find(
      (s) =>
        s.name.toLowerCase() === q ||
        s.name.toLowerCase().includes(q) ||
        s.empNo.toLowerCase() === q
    );
    if (!student) {
      setMatch(null);
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setMatch({
      student,
      exams: data.exams.filter((x) => x.studentId === student.id),
      courses: data.courses.filter((c) => c.studentId === student.id),
    });
  };

  if (loading || directLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-forest-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        正在從 Google 試算表載入全部資料（含人員、課程、考試）...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-6">
        <div className="flex items-start gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">資料載入失敗</p>
            <p className="text-sm text-forest-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-1">
          <IdCard className="w-5 h-5 text-mint-600" />
          <h2 className="font-semibold text-forest-900">學員歷史查詢</h2>
        </div>
        <p className="text-sm text-forest-500 mb-4">
          輸入員工編號（如 LF0039）或姓名，查詢夥伴的門市、職位、入離職日、課程與考試紀錄。
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="輸入員工編號或姓名（例如：LF0039、林志宗）"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 placeholder:text-forest-400 focus:outline-none focus:ring-2 focus:ring-mint-400 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-mint-500 text-white font-semibold text-sm shadow-card hover:bg-mint-600 hover:shadow-cardHover transition-all"
          >
            <Search className="w-4 h-4" />
            查詢
          </button>
        </form>
        {!match && submitted && notFound && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            查無符合「{submitted}」的學員資料，請確認員工編號或姓名後再試一次。
          </div>
        )}
      </div>

      {match && direct && <StudentDetail match={match} direct={direct} />}
    </div>
  );
}

function StudentDetail({ match, direct }: { match: Match; direct: DirectData }) {
  const { student, exams, courses } = match;
  const { courseDefs } = direct;

  // 動態及格門檻查詢
  const passScoreOf = useMemo(() => {
    const byName = new Map<string, number>();
    for (const d of courseDefs) byName.set(d.name, d.passScore);
    return (subject: string): number => {
      if (byName.has(subject)) return byName.get(subject)!;
      for (const [name, score] of byName) {
        if (subject.includes(name) || name.includes(subject)) return score;
      }
      return subject.includes('食安') ? 80 : 85;
    };
  }, [courseDefs]);

  // 重新判定及格（依動態門檻）
  const regradedExams = useMemo(
    () => exams.map((e) => {
      const passScore = passScoreOf(e.examName);
      return { ...e, passScore, passed: e.score >= passScore };
    }),
    [exams, passScoreOf]
  );

  // 食安完課日期：無簽到表，以考試時間戳記為準
  const foodSafetyCourseDate = useMemo(() => {
    const foodExam = regradedExams
      .filter((e) => e.examName.includes('食安') || e.examName.includes('食品安全'))
      .sort((a, b) => a.examDate.localeCompare(b.examDate))[0];
    return foodExam?.examDate ?? null;
  }, [regradedExams]);

  // 課程紀錄：補入食安完課日期
  const mergedCourses = useMemo(() => {
    const hasFoodSafetyCourse = courses.some((c) => c.courseName.includes('食安') || c.courseName.includes('食品安全'));
    if (foodSafetyCourseDate && !hasFoodSafetyCourse) {
      return [
        ...courses,
        {
          id: `${student.id}_food`,
          studentId: student.id,
          courseName: '食品安全',
          period: '—',
          courseDate: foodSafetyCourseDate,
          source: '課程' as const,
        },
      ];
    }
    return courses.map((c) => {
      if ((c.courseName.includes('食安') || c.courseName.includes('食品安全')) && foodSafetyCourseDate && c.courseDate === '—') {
        return { ...c, courseDate: foodSafetyCourseDate };
      }
      return c;
    });
  }, [courses, foodSafetyCourseDate, student.id]);

  // 最終合格狀態：每個科目至少一次及格
  const finalQualified = useMemo(() => {
    if (regradedExams.length === 0) return false;
    const subjects = new Set(regradedExams.map((e) => e.examName));
    return Array.from(subjects).every((subj) =>
      regradedExams.some((e) => e.examName === subj && e.passed)
    );
  }, [regradedExams]);

  const passedCount = regradedExams.filter((e) => e.passed).length;
  const passRate = regradedExams.length > 0 ? Math.round((passedCount / regradedExams.length) * 100) : 0;
  const bestScore = regradedExams.length > 0 ? Math.max(...regradedExams.map((e) => e.score)) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div
            className={`w-20 h-20 rounded-2xl ${student.avatarColor} text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-card`}
          >
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-forest-900">{student.name}</h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                student.status === '在職'
                  ? 'bg-mint-100 text-mint-700 border-mint-200'
                  : 'bg-forest-50 text-forest-600 border-forest-100'
              }`}>
                {student.status}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-50 text-forest-700 border border-forest-100">
                {student.channel}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                finalQualified
                  ? 'bg-mint-100 text-mint-700 border-mint-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {finalQualified ? '最終合格' : '尚未全部合格'}
              </span>
            </div>
            <p className="text-sm text-forest-500 mt-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              員工編號 <span className="font-semibold text-forest-800">{student.empNo}</span>
              <span className="text-forest-300">·</span>
              最近測驗 <span className="font-semibold text-forest-800">{student.lastExamDate}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-forest-50">
          <InfoRow icon={Store} label="所屬門市" value={student.store} />
          <InfoRow icon={Briefcase} label="職位" value={student.position} />
          <InfoRow icon={Calendar} label="入職日" value={student.hireDate} />
          <InfoRow
            icon={CalendarOff}
            label="離職日"
            value={student.leaveDate ?? '—'}
            highlight={!!student.leaveDate}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <MiniStat label="測驗次數" value={`${exams.length}`} icon={Award} color="text-mint-600 bg-mint-50" />
          <MiniStat label="課程紀錄" value={`${courses.length}`} icon={BookOpen} color="text-forest-600 bg-forest-50" />
          <MiniStat label="最佳成績" value={`${bestScore}`} unit="分" icon={TrendingUp} color="text-mint-600 bg-mint-50" />
          <MiniStat label="及格率" value={`${passRate}`} unit="%" icon={CheckCircle2} color="text-forest-600 bg-forest-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CourseRecordsBlock courses={mergedCourses} />
        <ExamRecordsBlock exams={regradedExams} />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  unit,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Award;
  color: string;
}) {
  return (
    <div className="bg-forest-50/50 rounded-xl p-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-forest-500">{label}</p>
      <p className="text-lg font-bold text-forest-900">
        {value}
        {unit && <span className="text-xs font-medium text-forest-500 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-forest-50 text-forest-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-forest-500">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-amber-700' : 'text-forest-900'} truncate`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function CourseRecordsBlock({ courses }: { courses: SheetCourseRecord[] }) {
  const sorted = courses.slice().sort((a, b) => a.courseDate.localeCompare(b.courseDate));
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-forest-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">課程紀錄</h3>
        </div>
        <span className="text-xs text-forest-500">{courses.length} 筆</span>
      </div>
      <ul className="divide-y divide-forest-50 max-h-[480px] overflow-y-auto">
        {sorted.map((c) => (
          <li key={c.id} className="px-5 py-4 hover:bg-forest-50/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-forest-900 truncate">{c.courseName}</p>
                <p className="text-xs text-forest-500 mt-0.5">
                  期數 {c.period} · 日期 {c.courseDate}
                </p>
              </div>
            </div>
          </li>
        ))}
        {courses.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-forest-500">尚無課程紀錄</li>
        )}
      </ul>
    </div>
  );
}

function ExamRecordsBlock({ exams }: { exams: (SheetExam & { passScore: number })[] }) {
  const sorted = exams.slice().sort((a, b) => b.examDate.localeCompare(a.examDate));
  const passedCount = exams.filter((e) => e.passed).length;
  const pct = exams.length > 0 ? Math.round((passedCount / exams.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-forest-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-mint-600" />
          <h3 className="font-semibold text-forest-900">考試紀錄</h3>
        </div>
        <span className="text-xs text-forest-500">
          {passedCount}/{exams.length} 及格 · {pct}%
        </span>
      </div>
      <div className="px-5 pt-4">
        <ProgressBar value={pct} showValue={false} size="sm" />
      </div>
      <ul className="divide-y divide-forest-50 max-h-[440px] overflow-y-auto">
        {sorted.map((x) => (
          <li key={x.id} className="px-5 py-4 hover:bg-forest-50/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-forest-900 truncate">{x.examName}</p>
                <p className="text-xs text-forest-500 mt-0.5">
                  測驗日期 {x.examDate} · 第 {x.attempt} 次作答 · 及格門檻 {x.passScore} 分
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-bold ${x.passed ? 'text-mint-700' : 'text-red-600'}`}>
                  {x.score} 分
                </span>
                {x.passed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-700 bg-mint-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 及格
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" /> 未通過
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
        {exams.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-forest-500">尚無考試紀錄</li>
        )}
      </ul>
    </div>
  );
}


