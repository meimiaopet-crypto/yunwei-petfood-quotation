'use client';
import * as React from 'react';
import { Card, CardContent, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Download, FileSpreadsheet, Plus } from 'lucide-react';
import Link from 'next/link';

const MOCK_PI = [
  { piNo: 'YW-PI-20240710-001', quoteRef: 'YW-QT-20240710-001', customer: 'Viet Pet Co.', country: 'VN', amount: 24680, currency: 'USD', status: '已发送', date: '2024-07-10' },
  { piNo: 'YW-PI-20240705-002', quoteRef: 'YW-QT-20240705-002', customer: 'Al Noor Pet',  country: 'SA', amount: 56400, currency: 'USD', status: '已收款', date: '2024-07-05' },
];

export default function ProformaInvoicesPage() {
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
              {MOCK_PI.map((pi) => (
                <tr key={pi.piNo} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-xs">{pi.piNo}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{pi.quoteRef}</td>
                  <td className="px-4 py-2.5 font-medium">{pi.customer}</td>
                  <td className="px-4 py-2.5">{pi.country}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">${pi.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><Badge tone={pi.status === '已收款' ? 'green' : 'blue'}>{pi.status}</Badge></td>
                  <td className="px-4 py-2.5 text-xs text-muted">{pi.date}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline"><Download className="w-3.5 h-3.5" />下载</Button>
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
