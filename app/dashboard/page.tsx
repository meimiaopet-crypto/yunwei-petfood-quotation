'use client';
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, FileText, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// 演示用 mock 数据（生产环境替换为 data.quotations.list()）
const MOCK_STATS = {
  thisMonthQuotes: 24,
  wonThisMonth: 9,
  totalAmount: 187450,
  pendingFollowup: 8,
  expiringSoon: 3,
};

const MOCK_TREND = [
  { m: '2月', amount: 124500 },
  { m: '3月', amount: 156200 },
  { m: '4月', amount: 98600 },
  { m: '5月', amount: 178300 },
  { m: '6月', amount: 213400 },
  { m: '7月', amount: 187450 },
];

const RECENT = [
  { no: 'YW-QT-20240710-001', customer: 'CÔNG TY TNHH THÚ CƯNG VIỆT PET', country: 'VN', amount: 24680, status: '已发送', days: 2 },
  { no: 'YW-QT-20240708-003', customer: 'PawPal Trading Sdn Bhd',          country: 'MY', amount: 18350, status: '谈判中', days: 4 },
  { no: 'YW-QT-20240705-002', customer: 'Al Noor Pet Supplies LLC',        country: 'SA', amount: 56400, status: '赢单',   days: 7 },
  { no: 'YW-QT-20240703-001', customer: 'Bangkok Pet Mart Co., Ltd.',      country: 'TH', amount: 9870,  status: '草稿',   days: 9 },
  { no: 'YW-QT-20240701-001', customer: 'CÔNG TY TNHH THÚ CƯNG VIỆT PET', country: 'VN', amount: 32100, status: '已发送', days: 12 },
];

const FOLLOWUPS = [
  { quote: 'YW-QT-20240628-002', customer: 'PawPal Trading', lastDays: 5,  status: '谈判中' },
  { quote: 'YW-QT-20240625-001', customer: 'Al Noor Pet',    lastDays: 7,  status: '已发送' },
];

const EXPIRING = [
  { quote: 'YW-QT-20240712-001', customer: 'Bangkok Pet Mart', remain: '3天', amount: 12400 },
  { quote: 'YW-QT-20240715-002', customer: 'Viet Pet Co.',     remain: '6天', amount: 8800 },
];

const statusTone: Record<string, 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'yellow'> = {
  草稿: 'gray', 已发送: 'blue', 谈判中: 'orange', 赢单: 'green', 输单: 'red', 过期: 'yellow',
};

const Stat = ({ label, value, suffix, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-5 flex items-start justify-between">
      <div>
        <div className="text-sm text-muted">{label}</div>
        <div className="text-2xl font-semibold mt-1.5">
          {value}<span className="text-base text-muted ml-1">{suffix}</span>
        </div>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const winRate = Math.round((MOCK_STATS.wonThisMonth / MOCK_STATS.thisMonthQuotes) * 100);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">控制台</h1>
          <p className="text-sm text-muted mt-0.5">本月报价/成交总览</p>
        </div>
        <Link href="/quotations/new">
          <Button><Plus className="w-4 h-4" />新建报价单</Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="本月报价单" value={MOCK_STATS.thisMonthQuotes} suffix="份" icon={FileText} color="bg-brand" />
        <Stat label="本月成交" value={MOCK_STATS.wonThisMonth} suffix={`单 (${winRate}%)`} icon={CheckCircle2} color="bg-success" />
        <Stat label="本月报价总金额" value={`$${MOCK_STATS.totalAmount.toLocaleString()}`} icon={TrendingUp} color="bg-warning" />
        <Stat label="待跟进" value={MOCK_STATS.pendingFollowup} suffix="份" icon={Clock} color="bg-danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 趋势图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>近 6 个月报价金额趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 待跟进 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              待跟进
              <Badge tone="orange">{FOLLOWUPS.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {FOLLOWUPS.map((f) => (
                <li key={f.quote} className="px-5 py-3">
                  <div className="text-sm font-medium">{f.customer}</div>
                  <div className="text-xs text-muted mt-0.5">{f.quote} · 状态：{f.status}</div>
                  <div className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />已 {f.lastDays} 天未回复
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 最近报价 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>最近报价单</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium">报价单号</th>
                  <th className="text-left px-5 py-2.5 font-medium">客户</th>
                  <th className="text-right px-5 py-2.5 font-medium">金额</th>
                  <th className="text-left px-5 py-2.5 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT.map((r) => (
                  <tr key={r.no} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono text-xs">{r.no}</td>
                    <td className="px-5 py-3">
                      <div>{r.customer}</div>
                      <div className="text-xs text-muted">{r.country}</div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">${r.amount.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone[r.status]}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 即将过期 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              即将过期
              <Badge tone="yellow">{EXPIRING.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {EXPIRING.map((e) => (
                <li key={e.quote} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{e.customer}</div>
                    <Badge tone="yellow">{e.remain}</Badge>
                  </div>
                  <div className="text-xs text-muted mt-0.5">{e.quote} · ${e.amount.toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
