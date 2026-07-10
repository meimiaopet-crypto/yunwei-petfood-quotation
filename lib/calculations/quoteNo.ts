/** 报价单号生成辅助（数字流水号） */
export function nextSeq(existingNos: string[], date: Date, prefix: 'QT' | 'PI' = 'QT'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateKey = `${y}${m}${d}`;
  const re = new RegExp(`^YW-${prefix}-${dateKey}-(\\d{3})$`);
  const used = existingNos
    .map((n) => re.exec(n)?.[1])
    .filter(Boolean)
    .map((s) => Number(s));
  const max = used.length ? Math.max(...used) : 0;
  return `YW-${prefix}-${dateKey}-${String(max + 1).padStart(3, '0')}`;
}
