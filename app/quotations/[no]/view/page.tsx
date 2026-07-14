'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { QuotationPreview } from '@/components/quotation-builder/QuotationPreview';
import { data } from '@/lib/supabase/data';
import { summarizeQuotation } from '@/lib/calculations/priceEngine';
import { ArrowLeft, FileDown, FileSpreadsheet, FileText, Link as LinkIcon } from 'lucide-react';
import type { Quotation, Customer, CompanyProfile, TermsTemplate } from '@/types';

export default function QuotationViewPage() {
  const params = useParams();
  const quoteNo = decodeURIComponent((params.no as string) ?? '');
  const toast = useToast();

  const [loading, setLoading] = React.useState(true);
  const [quotation, setQuotation] = React.useState<Quotation | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [company, setCompany] = React.useState<CompanyProfile | null>(null);
  const [terms, setTerms] = React.useState<TermsTemplate[]>([]);

  React.useEffect(() => {
    if (!quoteNo) return;
    (async () => {
      try {
        const [q, allCustomers, co, allTerms] = await Promise.all([
          data.quotations.getByNo(quoteNo),
          data.customers.list(),
          data.company.get(),
          data.terms.list(),
        ]);
        if (!q) {
          toast.push({ type: 'error', title: '报价单不存在', description: quoteNo });
          setLoading(false);
          return;
        }
        setQuotation(q);
        setCompany(co);
        setTerms(allTerms);

        // Supabase 关联查询会返回 q.customer，回退到 customer_id 匹配
        const relCustomer = (q as unknown as Record<string, unknown>).customer;
        if (relCustomer && typeof relCustomer === 'object') {
          setCustomer(relCustomer as Customer);
        } else if (q.customer_id) {
          setCustomer(allCustomers.find((c) => c.id === q.customer_id) ?? null);
        }
      } catch (e: any) {
        toast.push({ type: 'error', title: '加载失败', description: e?.message || String(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [quoteNo]);

  if (loading) {
    return <div className="p-10 text-center text-sm text-muted">加载中…</div>;
  }

  if (!quotation) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-muted">报价单不存在或已被删除</p>
        <Link href="/quotations" className="inline-block mt-4">
          <Button variant="outline"><ArrowLeft className="w-4 h-4" />返回报价单列表</Button>
        </Link>
      </div>
    );
  }

  const summary = summarizeQuotation({
    items: quotation.items ?? [],
    logisticsCost: Number(quotation.logistics_cost || 0),
    insuranceRate: Number(quotation.insurance_rate || 0),
    taxRate: Number(quotation.tax_rate || 0),
    incoterms: quotation.incoterms,
    exchangeRate: Number(quotation.exchange_rate || 1),
  });

  const selectedTermIds = (quotation as unknown as { selected_term_ids?: string[] }).selected_term_ids ?? [];
  const selectedTerms = terms.filter((t) => selectedTermIds.includes(t.id));

  const meta = {
    quoteNo: quotation.quote_no,
    date: (quotation as unknown as { created_at?: string }).created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    validUntil: quotation.valid_until ?? '',
    language: quotation.language,
    currency: quotation.currency,
    incoterms: quotation.incoterms,
    portOfLoading: quotation.port_of_loading ?? '',
    portOfDestination: quotation.port_of_destination ?? '',
    paymentTerms: quotation.payment_terms ?? '',
    leadTime: quotation.lead_time ?? '',
    logisticsCost: Number(quotation.logistics_cost || 0),
    logisticsType: quotation.logistics_type,
    taxRate: Number(quotation.tax_rate || 0),
    insuranceRate: Number(quotation.insurance_rate || 0),
    otherCharges: Number(quotation.other_charges || 0),
    notes: quotation.notes ?? '',
  };

  const downloadPdf = (kind: 'quotation' | 'pi') => {
    const url = `/api/quotations/${encodeURIComponent(quotation.quote_no)}/pdf?lang=${quotation.language}&kind=${kind}`;
    window.open(url, '_blank');
  };

  const downloadExcel = () => {
    const url = `/api/quotations/${encodeURIComponent(quotation.quote_no)}/xlsx?lang=${quotation.language}`;
    window.open(url, '_blank');
  };

  const copyLink = () => {
    const link = `${window.location.origin}/quotations/${encodeURIComponent(quotation.quote_no)}/view`;
    navigator.clipboard?.writeText(link);
    toast.push({ type: 'success', title: '链接已复制', description: link });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/quotations">
            <Button variant="ghost"><ArrowLeft className="w-4 h-4" />返回</Button>
          </Link>
          <h1 className="text-xl font-semibold">报价单预览</h1>
          <span className="font-mono text-sm text-muted">{quotation.quote_no}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadPdf('quotation')}><FileText className="w-4 h-4" />导出报价单 PDF</Button>
          <Button size="sm" variant="outline" onClick={() => downloadPdf('pi')}><FileDown className="w-4 h-4" />导出 PI</Button>
          <Button size="sm" variant="outline" onClick={downloadExcel}><FileSpreadsheet className="w-4 h-4" />导出 Excel</Button>
          <Button size="sm" variant="ghost" onClick={copyLink}><LinkIcon className="w-4 h-4" />复制链接</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 bg-slate-100">
          <QuotationPreview
            company={company}
            customer={customer}
            items={quotation.items ?? []}
            summary={summary}
            meta={meta}
            terms={selectedTerms}
            showProfit={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
