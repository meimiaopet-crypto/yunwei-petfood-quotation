'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { Plus, Search, Eye, Edit2, Copy, GitBranch, Trash2, FileText, Download } from 'lucide-react';
import { data } from '@/lib/supabase/data';
import type { Quotation, QuotationStatus, Customer } from '@/types';

const STATUS_TONE: Record<QuotationStatus, 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'yellow'> = {
  草稿: 'gray', 已发送: 'blue', 谈判中: 'orange', 赢单: 'green', 输单: 'red', 过期: 'yellow', 已改版: 'gray',
};
const STATUSES = ['全部', '草稿', '已发送', '谈判中', '赢单', '输单', '过期'] as const;
const COUNTRIES = ['全部', 'VN', 'MY', 'TH', 'SA', 'AE'] as const;

export default function QuotationsListPage() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = React.useState<typeof STATUSES[number]>('全部');
  const [country, setCountry] = React.useState<typeof COUNTRIES[number]>('全部');
  const [kw, setKw] = React.useState('');
  const [list, setList] = React.useState<Quotation[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 加载真实数据
  React.useEffect(() => {
    (async () => {
      try {
        const [qs, cs] = await Promise.all([data.quotations.list(), data.customers.list()]);
        setList(qs);
        setCustomers(cs);
      } catch (e: any) {
        toast.push({ type: 'error', title: '加载失败', description: e?.message });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 客户 + 国家映射
  const customerMap = React.useMemo(() => {
    const m: Record<string, Customer> = {};
    customers.forEach((c) => { if (c.id) m[c.id] = c; });
    return m;
  }, [customers]);

  // 汇总金额
  const amountOf = (q: Quotation) => {
    const sub = (q.items ?? []).reduce((s, it) => s + (Number(it.total_price) || 0), 0);
    return sub + Number(q.logistics_cost || 0) + Number(q.other_charges || 0);
  };

  const filtered = list.filter((q) => {
    if (status !== '全部' && q.status !== status) return false;
    const cust = customerMap[q.customer_id ?? ''];
    if (country !== '全部' && cust?.country !== country) return false;
    if (kw) {
      const text = `${q.quote_no} ${cust?.company_name ?? ''}`.toLowerCase();
      if (!text.includes(kw.toLowerCase())) return false;
    }
    return true;
  });

  const stats = {
    total: list.length,
    draft: list.filter((q) => q.status === '草稿').length,
    sent: list.filter((q) => q.status === '已发送').length,
    neg: list.filter((q) => q.status === '谈判中').length,
    won: list.filter((q) => q.status === '赢单').length,
  };

  // 下载 PDF
  const downloadPdf = (q: Quotation) => {
    const lang = q.language || 'en';
    const url = `/api/quotations/${encodeURIComponent(q.quote_no)}/pdf?lang=${lang}&kind=quotation`;
    window.open(url, '_blank');
  };

  // 删除草稿
  const removeDraft = async (q: Quotation) => {
    if (!confirm(`确认删除草稿 ${q.quote_no}？`)) return;
    try {
      // 用 service 端 API 更稳；这里走浏览器直接 delete
      // 注意：先删 items，再删 header
      const { getBrowserSupabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (!isSupabaseConfigured()) { toast.push({ type: 'warning', title: '未配置 Supabase' }); return; }
      const sb = getBrowserSupabase();
      await sb.from('quotation_items').delete().eq('quotation_id', q.id);
      await sb.from('quotations').delete().eq('id', q.id);
      setList((arr) => arr.filter((x) => x.id !== q.id));
      toast.push({ type: 'success', title: '已删除' });
    } catch (e: any) {
      toast.push({ type: 'error', title: '删除失败', description: e?.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">报价单</h1>
          <p className="text-sm text-muted mt-0.5">
            共 {stats.total} 份 · 草稿 {stats.draft} · 已发送 {stats.sent} · 谈判中 {stats.neg} · 赢单 {stats.won}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>刷新</Button>
          <Link href="/quotations/new"><Button><Plus className="w-4 h-4" />新建报价单</Button></Link>
        </div>
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
          {loading ? (
            <div className="p-10 text-center text-sm text-muted">加载中…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              {list.length === 0 ? '数据库暂无报价单，点击右上角「新建报价单」开始' : '没有符合筛选条件的报价单'}
            </div>
          ) : (
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
                {filtered.map((q) => {
                  const cust = q.customer_id ? customerMap[q.customer_id] : undefined;
                  const amt = amountOf(q);
                  return (
                    <tr key={q.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{q.quote_no}</td>
                      <td className="px-4 py-2.5 font-medium">{cust?.company_name ?? '(未关联客户)'}</td>
                      <td className="px-4 py-2.5">{cust?.country ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {q.currency === 'USD' ? '$' : q.currency + ' '}
                        {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5"><Badge tone={STATUS_TONE[q.status as QuotationStatus]}>{q.status}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-muted">{q.valid_until ?? '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{(q as any).created_at?.slice(0, 10) ?? (q as any).updated_at?.slice(0, 10) ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex gap-1">
                          <button className="p-1.5 rounded hover:bg-muted/40" title="查看" onClick={() => window.open(`/quotations/${encodeURIComponent(q.quote_no)}/view`, '_blank')}><Eye className="w-4 h-4" /></button>
                          <Link href={`/quotations/new?no=${encodeURIComponent(q.quote_no)}`} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="编辑"><Edit2 className="w-4 h-4" /></Link>
                          <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="下载 PDF" onClick={() => downloadPdf(q)}><Download className="w-4 h-4" /></button>
                          <button className="p-1.5 rounded hover:bg-red-50 text-danger" title="删除" onClick={() => removeDraft(q)}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
