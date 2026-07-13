/**
 * GET /api/quotations/[no]/pdf?lang=en&kind=quotation|pi
 * 服务端渲染 Quotation / PI PDF（@react-pdf/renderer）
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
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
      sb.from('customers').select('*').eq('id', header.customer_id).maybeSingle(),
      sb.from('company_profile').select('*').limit(1).maybeSingle(),
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

    // 直接调用组件函数（而不是 React.createElement 包装），
    // 这样 renderToBuffer 拿到的是真正的 Document 元素而不是 component wrapper
    // 兜底：把 incoterms/logistics_type/currency/language 规整为有效值
    const safeIncoterms = (['FOB', 'CIF', 'CFR', 'EXW'] as const).includes(header.incoterms as any)
      ? header.incoterms : 'FOB';
    const safeLogistics = (['海运', '空运', '陆运'] as const).includes(header.logistics_type as any)
      ? header.logistics_type : '海运';
    const safeCurrency = (['USD', 'CNY', 'VND', 'MYR', 'THB', 'SAR', 'AED'] as const).includes(header.currency as any)
      ? header.currency : 'USD';
    const safeLang = (['zh', 'en', 'vi'] as const).includes(lang as any) ? lang : 'en';

    // 用 mock 数据兜底 company + customer + terms，避免数据库里没有时崩溃
    const safeCompany = company ?? {
      id: 'mock', name_zh: '邢台云威进出口有限公司', name_en: 'Xingtai Yunwei Import and Export Co., Ltd.',
      address_zh: '', address_en: '', phone: '', email: '', website: '',
      logo_url: null, seal_url: null, default_locale: 'zh' as const,
      bank_info: null,
    };
    const safeTerms = (terms ?? []) as TermsTemplate[];

    const doc = (QuotationPdf as any)({
      kind, company: safeCompany as any, customer: customer as Customer | null,
      items: (items ?? []) as QuotationItem[], summary, terms: safeTerms,
      meta: {
        quoteNo: header.quote_no ?? 'DRAFT', piNo: header.pi_no, date: header.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        validUntil: header.valid_until ?? new Date().toISOString().slice(0, 10),
        language: safeLang as any, currency: safeCurrency as any,
        incoterms: safeIncoterms as any, portOfLoading: header.port_of_loading ?? '',
        portOfDestination: header.port_of_destination ?? '', paymentTerms: header.payment_terms ?? '',
        leadTime: header.lead_time ?? '', logisticsCost: Number(header.logistics_cost ?? 0),
        logisticsType: safeLogistics as any, taxRate: Number(header.tax_rate ?? 0),
        insuranceRate: Number(header.insurance_rate ?? 0.003),
        otherCharges: Number(header.other_charges ?? 0), notes: header.notes ?? '',
      },
    });

    const buf = await renderToBuffer(doc);
    // Next.js 15 期望 Uint8Array 而非 Node Buffer
    const body = new Uint8Array(buf);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${kind === 'pi' ? 'inline' : 'attachment'}; filename="${no}_${kind}_${safeLang}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error('[PDF] error:', e);
    return NextResponse.json({
      error: 'PDF generation failed',
      detail: e?.message,
      name: e?.name,
      str: (() => { try { return JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 3000); } catch { return String(e); } })(),
    }, { status: 500 });
  }
}

