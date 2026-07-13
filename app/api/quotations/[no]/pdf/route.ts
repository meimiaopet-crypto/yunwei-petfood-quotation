/**
 * GET /api/quotations/[no]/pdf?lang=en&kind=quotation|pi
 * 服务端渲染 Quotation / PI PDF（@react-pdf/renderer）
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { QuotationPdf } from '@/components/pdf-templates/QuotationPdf';
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { summarizeQuotation } from '@/lib/calculations/priceEngine';
import type { Locale, Customer, Product, ProductTierPrice, QuotationItem, TermsTemplate, CompanyProfile } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'en') as Locale;
  const kind = (req.nextUrl.searchParams.get('kind') ?? 'quotation') as 'quotation' | 'pi';

  if (!isSupabaseConfigured()) {
    // 演示环境：返回说明
    return NextResponse.json(
      { error: 'Supabase not configured', message: 'PDF 生成需要先连接 Supabase 数据库。请在 .env.local 配置 NEXT_PUBLIC_SUPABASE_URL 后使用。' },
      { status: 503 },
    );
  }

  try {
    const sb = getBrowserSupabase();
    const { data: header } = await sb.from('quotations').select('*').eq('quote_no', no).single();
    if (!header) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

    const [{ data: items }, { data: customer }, { data: company }, { data: terms }] = await Promise.all([
      sb.from('quotation_items').select('*').eq('quotation_id', header.id).order('line_no'),
      sb.from('customers').select('*').eq('id', header.customer_id).single(),
      sb.from('company_profile').select('*').limit(1).single(),
      sb.from('terms_templates').select('*'),
    ]);

    const summary = summarizeQuotation({
      items: (items ?? []) as QuotationItem[],
      logisticsCost: Number(header.logistics_cost ?? 0),
      insuranceRate: Number(header.insurance_rate ?? 0.003),
      taxRate: Number(header.tax_rate ?? 0),
      incoterms: header.incoterms as any,
      exchangeRate: Number(header.exchange_rate ?? 1),
    });

    const doc = React.createElement(QuotationPdf, {
      kind, company: company as CompanyProfile, customer: customer as Customer,
      items: (items ?? []) as QuotationItem[], summary, terms: (terms ?? []) as TermsTemplate[],
      meta: {
        quoteNo: header.quote_no, piNo: header.pi_no, date: header.created_at?.slice(0, 10),
        validUntil: header.valid_until, language: lang, currency: header.currency,
        incoterms: header.incoterms, portOfLoading: header.port_of_loading,
        portOfDestination: header.port_of_destination, paymentTerms: header.payment_terms,
        leadTime: header.lead_time, logisticsCost: Number(header.logistics_cost ?? 0),
        logisticsType: header.logistics_type, taxRate: Number(header.tax_rate ?? 0),
        insuranceRate: Number(header.insurance_rate ?? 0.003),
        otherCharges: Number(header.other_charges ?? 0), notes: header.notes ?? '',
      },
    });

    const buf = await renderToBuffer(doc as any);
    // Next.js 15 期望 Uint8Array 而非 Node Buffer
    const body = new Uint8Array(buf);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${kind === 'pi' ? 'inline' : 'attachment'}; filename="${no}_${kind}_${lang}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'PDF generation failed', detail: e?.message }, { status: 500 });
  }
}
