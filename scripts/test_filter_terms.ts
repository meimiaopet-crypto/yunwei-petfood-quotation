/**
 * 单元测试：filterTermsBySelection
 * 用 node --experimental-strip-types 直接运行（Node 22+），无需测试框架。
 */
import { filterTermsBySelection } from '../lib/pdf/filterTerms.ts';

const terms = [
  { id: 'tm1', name: '30/70 定金', type: 'payment' },
  { id: 'tm2', name: '即期信用证', type: 'payment' },
  { id: 'tm3', name: '25-30 工作日交货', type: 'delivery' },
  { id: 'tm4', name: '质量保证', type: 'quality' },
] as any[];

let passed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  passed++;
  console.log('PASS:', msg);
}

// 1. undefined → 全部
let r = filterTermsBySelection(terms, undefined);
assert(r.length === 4, 'undefined -> 全部 4 条');

// 2. 空数组 → 全部
r = filterTermsBySelection(terms, []);
assert(r.length === 4, '空数组 -> 全部 4 条');

// 3. 非数组 → 全部
r = filterTermsBySelection(terms, 'tm1');
assert(r.length === 4, '非数组 -> 全部 4 条');

// 4. 部分勾选（保持原顺序）
r = filterTermsBySelection(terms, ['tm2', 'tm4']);
assert(r.length === 2, '部分勾选 -> 2 条');
assert(r[0].id === 'tm2' && r[1].id === 'tm4', '部分勾选按原顺序返回');

// 5. 按勾选顺序排序（逆序勾选）
r = filterTermsBySelection(terms, ['tm4', 'tm1', 'tm3']);
assert(
  JSON.stringify(r.map((t) => t.id)) === JSON.stringify(['tm4', 'tm1', 'tm3']),
  '按勾选顺序排序',
);

// 6. 勾选不存在的 id → 忽略
r = filterTermsBySelection(terms, ['tm1', 'nope']);
assert(r.length === 1 && r[0].id === 'tm1', '忽略不存在的 id');

console.log(`\nALL ${passed} TESTS PASSED`);
