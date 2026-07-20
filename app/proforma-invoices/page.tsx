'use client';
import * as React from 'react';
import { Card, CardContent, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Download } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { data } from '@/lib/supabase/data';
import type { Quotation } from '@/types';

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'yellow'> = {
  草稿: 'gray', 已发送: 'blue', 谈判中: 'orange', 赢单: 'green', 输单: 'red', 过期: 'yellow', 已改版: 'gray',
  已收款: 'green',
};

export default function ProformaInvoicesPage() {
  const toast = useToast();
  const [list, setList] = React.useState<Quotation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const pis = await data.quotations.listPIs();
        setList(pis);
      } catch (e: any) {
        toast.push({ type: 'error', title: '加载失败', description: e?.message });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountOf = (q: Quotation) => {
    const sub = (q.items ?? []).reduce((s, it) => s + (Number(it.total_price) || 0), 0);
    return sub + Number(q.logistics_cost || 0) + Number(q.other_charges || 0);
  };

  const downloadPi = (q: Quotation) => {
    const lang = q.language || 'en';
    const quoteNo = encodeURIComponent(q.quote_no);
    const url = `/api/quotations/${quoteNo}/pdf?lang=${lang}&kind=pi`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">形式发票 (PI)</h1>
          <p className="text-sm text-muted mt-0.5">基于已确认报价单生成的 Proforma Invoice</p>
        </div>
        <Link href="/quotations/new"><Button><Plus className="w-4 h-4" />从报价单生成 PI</Button></Link>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted">加载中…</div>
          ) : list.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              暂无形式发票，点击右上角「从报价单生成 PI」开始
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">PI 编号</th>
                  <th className="text-left px-4 py-2.5 font-medium">关联报价单</th>
                  <th className="text-left px-4 py-2.5 font-medium">客户</th>
                  <th className="text-left px-4 py-2.5 font-medium">国家</th>
                  <th className="text-right px-4 py-2.5 font-medium">金额</th>
                  <th className="text-left px-4 py-2.5 font-medium">状态</th>
                  <th className="text-left px-4 py-2.5 font-medium">日期</th>
                  <th className="text-right px-4 py-2.5 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((q) => {
                  const customer = q.customer as any;
                  const amt = amountOf(q);
                  return (
                    <tr key={q.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{q.pi_no ?? '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">{q.quote_no}</td>
                      <td className="px-4 py-2.5 font-medium">{customer?.company_name ?? '(未关联客户)'}</td>
                      <td className="px-4 py-2.5">{customer?.country ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {q.currency === 'USD' ? '$' : q.currency + ' '}
                        {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5"><Badge tone={STATUS_TONE[q.status ?? ''] ?? 'gray'}>{q.status}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-muted">{(q as any).created_at?.slice(0, 10) ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button size="sm" variant="outline" onClick={() => downloadPi(q)}>
                          <Download className="w-3.5 h-3.5" />下载
                        </Button>
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
