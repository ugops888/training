// 依登入身分過濾「課程與考試清單」：課程清單中若有與身分同名的欄位，打勾的課程才看得到；
// 沒有該身分的欄位時，所有課程都看得到。（正式模式由後端 Code.gs 做同樣的過濾，這份只供預覽模式使用。）
const norm = (v: string) => (v ?? '').replace(/[\uFEFF\s\u3000]/g, '');
const isChecked = (v: string) => /^(true|是|v|y|yes|1|✓|✔|☑)$/i.test((v ?? '').trim());

export function filterCourseRows(rows: string[][], role: string): string[][] {
  if (!role) return rows;
  const hi = rows.findIndex((r, i) => i < 6 && r.some((c) => norm(c) === '課程名稱'));
  if (hi < 0) return rows;
  const col = rows[hi].map(norm).indexOf(norm(role));
  if (col < 0) return rows;
  return rows.filter((r, i) => i <= hi || isChecked(r[col] ?? ''));
}
