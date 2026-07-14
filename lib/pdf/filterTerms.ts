/**
 * 按用户在「新建报价单」页勾选的条款，筛选并排序 PDF 渲染用的条款列表。
 *
 * 设计要点：
 * - selectedIds 为空数组 / 非数组 / undefined 时 → 返回全部 terms（兼容老数据、DB 迁移未执行场景）。
 * - 否则只保留被勾选的条款，且**按用户勾选顺序**排序（而非 DB 原始顺序），符合预期。
 * - 纯函数、无外部依赖，便于在 route 调用与单元测试。
 */
import type { TermsTemplate } from '@/types';

export function filterTermsBySelection(
  terms: TermsTemplate[],
  selectedIds: unknown,
): TermsTemplate[] {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return terms;
  }
  const ids = selectedIds.map(String);
  const orderMap = new Map<string, number>();
  ids.forEach((id, idx) => orderMap.set(id, idx));

  return terms
    .filter((t) => orderMap.has(t.id))
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
}
