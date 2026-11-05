import { useState, useMemo } from 'react';
import {
  PlayCircle,
  Search,
  Clock,
  Award,
  Tag,
  Loader2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { fetchTrainingCourses, type CourseExamDef } from '../data/directData';
import { useCachedData } from '../data/swrCache';
import MaterialViewer from './training/MaterialViewer';
import { parseMaterials, KIND_LABEL } from './training/materials';

interface CategoryGroup {
  category: string;
  courses: CourseExamDef[];
}

export default function TrainingPlatformPage() {
  const { data: courses, loading, error } = useCachedData<CourseExamDef[]>('training-courses', fetchTrainingCourses);
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // 依「課程類別」動態分組（完全由試算表資料驅動，不寫死任何分類名稱）
  const groups = useMemo<CategoryGroup[]>(() => {
    const list = courses ?? [];
    const map = new Map<string, CourseExamDef[]>();
    for (const c of list) {
      const cat = c.category || '未分類';
      const arr = map.get(cat) ?? [];
      arr.push(c);
      map.set(cat, arr);
    }
    return Array.from(map.entries())
      .map(([category, list]) => ({
        category,
        courses: list.sort((a, b) => a.name.localeCompare(b.name, 'zh')),
      }))
      .sort((a, b) => a.category.localeCompare(b.category, 'zh'));
  }, [courses]);

  // 搜尋篩選
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        courses: g.courses.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.courses.length > 0);
  }, [groups, search]);

  // 所有篩選後課程的扁平列表（用於追蹤選中項）
  const flatCourses = useMemo(
    () => filteredGroups.flatMap((g) => g.courses),
    [filteredGroups]
  );

  // 選中課程：以 name+category 作為唯一識別
  const selected = useMemo(() => {
    if (selectedKey) {
      const found = flatCourses.find((c) => `${c.name}|${c.category}` === selectedKey);
      if (found) return found;
    }
    return flatCourses[0] ?? null;
  }, [selectedKey, flatCourses]);

  const toggleCollapse = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSelect = (c: CourseExamDef) => {
    setSelectedKey(`${c.name}|${c.category}`);
    // 自動展開該類別
    setCollapsedCats((prev) => {
      if (prev.has(c.category || '未分類')) {
        const next = new Set(prev);
        next.delete(c.category || '未分類');
        return next;
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-forest-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        正在載入課程清單...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-6">
        <div className="flex items-start gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">課程資料載入失敗</p>
            <p className="text-sm text-forest-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-12 text-center">
        <BookOpen className="w-10 h-10 text-forest-300 mx-auto mb-3" />
        <p className="text-forest-600 font-medium">尚無課程資料</p>
        <p className="text-sm text-forest-400 mt-1">請確認課程與考試清單分頁已包含課程資料。</p>
      </div>
    );
  }

  const videoCount = (courses ?? []).filter((c) => parseMaterials(c.videoUrl).length > 0).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋課程名稱或類別..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-forest-200 bg-forest-50/40 text-sm text-forest-800 placeholder:text-forest-400 focus:outline-none focus:ring-2 focus:ring-mint-400 focus:border-transparent transition"
            />
          </div>
          <p className="text-xs text-forest-500 lg:shrink-0">
            共 {flatCourses.length} 門課程
            {videoCount > 0 && (
              <span className="ml-2 text-mint-600">· {videoCount} 門含教材</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <CourseListPanel
          groups={filteredGroups}
          selected={selected}
          onSelect={handleSelect}
          collapsedCats={collapsedCats}
          onToggleCollapse={toggleCollapse}
        />
        <VideoPlayerPanel course={selected} />
      </div>
    </div>
  );
}

function CourseListPanel({
  groups,
  selected,
  onSelect,
  collapsedCats,
  onToggleCollapse,
}: {
  groups: CategoryGroup[];
  selected: CourseExamDef | null;
  onSelect: (c: CourseExamDef) => void;
  collapsedCats: Set<string>;
  onToggleCollapse: (cat: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-forest-50 overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
      <div className="px-4 py-3 border-b border-forest-50 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-mint-600" />
        <h3 className="text-sm font-semibold text-forest-900">課程清單</h3>
      </div>
      <div className="overflow-y-auto flex-1">
        {groups.map((g) => {
          const isCollapsed = collapsedCats.has(g.category);
          return (
            <div key={g.category}>
              <button
                onClick={() => onToggleCollapse(g.category)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-forest-50/40 hover:bg-forest-50/70 transition-colors text-left"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                )}
                <span className="text-xs font-bold text-forest-700 tracking-wide">{g.category}</span>
                <span className="text-[10px] text-forest-400 ml-auto">{g.courses.length} 門</span>
              </button>
              {!isCollapsed && (
                <ul className="divide-y divide-forest-50/60">
                  {g.courses.map((c) => {
                    const key = `${c.name}|${c.category}`;
                    const isActive = selected !== null && `${selected.name}|${selected.category}` === key;
                    const mats = parseMaterials(c.videoUrl);
                    const hasVideo = mats.length > 0;
                    const kinds = Array.from(new Set(mats.map((m) => (m.kind === 'gdrive' ? '雲端' : KIND_LABEL[m.kind]))));
                    return (
                      <li key={key}>
                        <button
                          onClick={() => onSelect(c)}
                          className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                            isActive
                              ? 'bg-mint-50 border-l-[3px] border-mint-500'
                              : 'hover:bg-forest-50/40 border-l-[3px] border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <PlayCircle
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                hasVideo ? 'text-mint-500' : 'text-forest-300'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isActive ? 'text-mint-800' : 'text-forest-800'
                                }`}
                              >
                                {c.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {kinds.map((k) => (
                                  <span key={k} className="text-[10px] text-mint-500 font-medium">
                                    {k}
                                  </span>
                                ))}
                                {c.hours > 0 && (
                                  <span className="text-[10px] text-forest-400">{c.hours} HR</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 mt-1 shrink-0 transition-transform ${
                                isActive ? 'text-mint-500 translate-x-0' : 'text-forest-300 -translate-x-1'
                              }`}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-forest-500">找不到符合條件的課程</div>
        )}
      </div>
    </div>
  );
}

function VideoPlayerPanel({ course }: { course: CourseExamDef | null }) {
  if (!course) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-12 text-center">
        <PlayCircle className="w-12 h-12 text-forest-300 mx-auto mb-3" />
        <p className="text-forest-500">請從左側選擇一門課程開始觀看</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 教材檢視器：影片 / 圖片 / PDF */}
      <MaterialViewer key={`${course.name}|${course.category}`} title={course.name} raw={course.videoUrl} />

      {/* 課程詳細資訊區 */}
      <div className="bg-white rounded-2xl shadow-card border border-forest-50 p-5 md:p-6 space-y-5">
        {/* 第一部分：頂部標題與數據卡片 */}
        <div>
          {/* 第一行：課程主標題 */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-forest-900 leading-snug">{course.name}</h3>
          </div>

          {/* 第二行：屬性與數據膠囊卡片 */}
          <div className="flex items-center gap-2.5 mt-3 flex-wrap">
            {/* 課程類別標籤 */}
            <span className="inline-flex items-center gap-1.5 text-sm text-forest-600">
              <Tag className="w-4 h-4 text-mint-500" />
              <span className="font-medium">{course.category || '未分類'}</span>
            </span>

            {/* 訓練時數膠囊卡片 */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint-50 border border-mint-100 text-sm text-mint-700">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-forest-500">訓練時數</span>
              <span className="font-semibold text-mint-800">
                {course.hours > 0 ? `${course.hours} HR` : '—'}
              </span>
            </span>

            {/* 及格門檻膠囊卡片 */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-sm text-forest-700">
              <Award className="w-3.5 h-3.5" />
              <span className="text-forest-500">及格門檻</span>
              <span className="font-semibold text-forest-800">{course.passScore} 分</span>
            </span>
          </div>
        </div>

        {/* 第二部分：課程內容說明卡片 */}
        <div className="rounded-xl border border-forest-100 bg-forest-50/30 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-forest-800">課程說明</h4>
          </div>
          {course.description ? (
            <p className="text-sm text-forest-700 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          ) : (
            <p className="text-sm text-forest-400 italic">
              尚未填寫課程說明。請在課程與考試清單試算表中新增「課程說明」欄位內容。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
