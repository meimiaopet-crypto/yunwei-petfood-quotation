'use client';
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Plus, Search, Eye, Edit2, Copy, GitBranch, Trash2, FileText, Download } from 'lucide-react';
import type { QuotationStatus } from '@/types';

const MOCK_LIST = [
  { no: 'YW-QT-20240710-001', customer: 'CÔNG TY TNHH THÚ CƯNG VIỆT PET', country: 'VN', amount: 24680, currency: 'USD', status: '已发送', valid: '2024-08-09', created: '2024-07-10' },
  { no: 'YW-QT-20240708-003', customer: 'PawPal Trading Sdn Bhd',          country: 'MY', amount: 18350, currency: 'USD', status: '谈判中', valid: '2024-08-07', created: '2024-07-08' },
  { no: 'YW-QT-20240705-002', customer: 'Al Noor Pet Supplies LLC',        country: 'SA', amount: 56400, currency: 'USD', status: '赢单',   valid: '2024-08-04', created: '2024-07-05' },
  { no: 'YW-QT-20240703-001', customer: 'Bangkok Pet Mart Co., Ltd.',      country: 'TH', amount: 9870,  currency: 'USD', status: '草稿',   valid: '2024-08-02', created: '2024-07-03' },
  { no: 'YW-QT-20240701-001', customer: 'CÔNG TY TNHH THÚ CƯNG VIỆT PET', country: 'VN', amount: 32100, currency: 'USD', status: '已发送', valid: '2024-07-31', created: '2024-07-01' },
  { no: 'YW-QT-20240628-002', customer: 'PawPal Trading Sdn Bhd',          country: 'MY', amount: 14200, currency: 'USD', status: '过期',   valid: '2024-07-28', created: '2024-06-28' },
  { no: 'YW-QT-20240625-001', customer: 'Al Noor Pet Supplies LLC',        country: 'SA', amount: 88000, currency: 'USD', status: '输单',   valid: '2024-07-25', created: '2024-06-25' },
];

const STATUS_TONE: Record<QuotationStatus, 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'yellow'> = {
  草稿: 'gray', 已发送: 'blue', 谈判中: 'orange', 赢单: 'green', 输单: 'red', 过期: 'yellow', 已改版: 'gray',
};
const STATUSES = ['全部', '草稿', '已发送', '谈判中', '赢单', '输单', '过期'] as const;
const COUNTRIES = ['全部', 'VN', 'MY', 'TH', 'SA', 'AE'] as const;

export default function QuotationsListPage() {
  const [status, setStatus] = React.useState<typeof STATUSES[number]>('全部');
  const [country, setCountry] = React.useState<typeof COUNTRIES[number]>('全部');
  const [kw, setKw] = React.useState('');

  const filtered = MOCK_LIST.filter((q) => {
    if (status !== '全部' && q.status !== status) return false;
    if (country !== '全部' && q.country !== country) return false;
    if (kw && !`${q.no} ${q.customer}`.toLowerCase().includes(kw.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: MOCK_LIST.length,
    draft: MOCK_LIST.filter((q) => q.status === '草稿').length,
    sent: MOCK_LIST.filter((q) => q.status === '已发送').length,
    neg: MOCK_LIST.filter((q) => q.status === '谈判中').length,
    won: MOCK_LIST.filter((q) => q.status === '赢单').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">报价单</h1>
          <p className="text-sm text-muted mt-0.5">共 {stats.total} 份 · 草稿 {stats.draft} · 已发送 {stats.sent} · 谈判中 {stats.neg} · 赢单 {stats.won}</p>
        </div>
        <Link href="/quotations/new"><Button><Plus className="w-4 h-4" />新建报价单</Button></Link>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Tabs items={STATUSES.map((s) => ({ value: s, label: s }))} value={status} onChange={(v) => setStatus(v as any)} />
          <Tabs items={COUNTRIES.map((c) => ({ value: c, label: c === '全部' ? '全部国家' : c }))} value={country} onChange={(v) => setCountry(v as any)} />
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-8 w-64" placeholder="搜索单号 / 客户" value={kw} onChange={(e) => setKw(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">报价单号</th>
                <th className="text-left px-4 py-2.5 font-medium">客户</th>
                <th className="text-left px-4 py-2.5 font-medium">国家</th>
                <th className="text-right px-4 py-2.5 font-medium">金额</th>
                <th className="text-left px-4 py-2.5 font-medium">状态</th>
                <th className="text-left px-4 py-2.5 font-medium">有效期</th>
                <th className="text-left px-4 py-2.5 font-medium">创建时间</th>
                <th className="text-right px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((q) => (
                <tr key={q.no} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-xs">{q.no}</td>
                  <td className="px-4 py-2.5 font-medium">{q.customer}</td>
                  <td className="px-4 py-2.5">{q.country}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">${q.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><Badge tone={STATUS_TONE[q.status as QuotationStatus]}>{q.status}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-muted">{q.valid}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{q.created}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button className="p-1.5 rounded hover:bg-muted/40" title="查看"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-muted/40" title="编辑"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-muted/40" title="复制"><Copy className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-muted/40" title="改版"><GitBranch className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-muted/40" title="下载 PDF"><Download className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-danger" title="删除"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
