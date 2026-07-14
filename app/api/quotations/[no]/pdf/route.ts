/**
 * GET /api/quotations/[no]/pdf?lang=en&kind=quotation|pi
 * 服务端渲染 Quotation / PI PDF（@react-pdf/renderer）
 * 健壮版本：所有字段 null-safe，所有缺失都用兜底值
 */
import { NextRequest, NextResponse } from 'next/server';
import { createElement } from 'react';
import { Readable } from 'stream';
import { renderToStream } from '@react-pdf/renderer';
import { QuotationPdf } from '@/components/pdf-templates/QuotationPdf';
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { summarizeQuotation } from '@/lib/calculations/priceEngine';
import { filterTermsBySelection } from '@/lib/pdf/filterTerms';
import type { Locale, Customer, Product, ProductTierPrice, QuotationItem, TermsTemplate, CompanyProfile } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 兜底常量
const VALID_INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW'] as const;
const VALID_LOGISTICS = ['海运', '空运', '陆运'] as const;
const VALID_CURRENCY = ['USD', 'CNY', 'VND', 'MYR', 'THB', 'SAR', 'AED'] as const;
const VALID_LOCALE = ['zh', 'en', 'vi'] as const;

const MOCK_COMPANY: CompanyProfile = {
  id: 'mock', name_zh: '邢台云伟进出口有限公司', name_en: 'Xingtai Yunwei Import and Export Co., Ltd.',
  address_zh: '', address_en: '', phone: '', email: '', website: '',
  logo_url: null, seal_url: null, default_locale: 'zh',
  bank_info: null,
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const langRaw = req.nextUrl.searchParams.get('lang') ?? 'en';
  const kind = (req.nextUrl.searchParams.get('kind') ?? 'quotation') as 'quotation' | 'pi';

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase not configured', message: 'PDF 生成需要先连接 Supabase 数据库。' },
      { status: 503 },
    );
  }

  try {
    const sb = getBrowserSupabase();
    const { data: header } = await sb.from('quotations').select('*').eq('quote_no', no).single();
    if (!header) {
      return NextResponse.json({ error: 'Quotation not found', quote_no: no }, { status: 404 });
    }

    // 四个并行查询全部改用 maybeSingle()，避免 null 触发 .single() 错误
    const [itemsRes, customerRes, companyRes, termsRes] = await Promise.all([
      sb.from('quotation_items').select('*').eq('quotation_id', header.id).order('line_no'),
      sb.from('customers').select('*').eq('id', header.customer_id).maybeSingle(),
      sb.from('company_profile').select('*').limit(1).maybeSingle(),
      sb.from('terms_templates').select('*'),
    ]);
    const items = itemsRes.data ?? [];
    const customer = customerRes.data;
    const company = companyRes.data ?? MOCK_COMPANY;
    const terms = termsRes.data ?? [];

    // 按用户在「新建报价单」页勾选的条款过滤（DB 无该列 / 老数据空数组时回退渲染全部）
    const selectedIds = (header as { selected_term_ids?: unknown }).selected_term_ids;
    const filteredTerms = filterTermsBySelection(terms as TermsTemplate[], selectedIds);

    const summary = summarizeQuotation({
      items: (items ?? []) as QuotationItem[],
      logisticsCost: Number(header.logistics_cost ?? 0),
      insuranceRate: Number(header.insurance_rate ?? 0.003),
      taxRate: Number(header.tax_rate ?? 0),
      incoterms: header.incoterms as any,
      exchangeRate: Number(header.exchange_rate ?? 1),
    });

    // === 核心：把所有可能 undefined 的字段规整为安全值 ===
    const safeLang: Locale = (VALID_LOCALE as readonly string[]).includes(langRaw) ? (langRaw as Locale) : 'en';
    const safeIncoterms = (VALID_INCOTERMS as readonly string[]).includes(header.incoterms as string) ? header.incoterms as any : 'FOB';
    const safeLogistics = (VALID_LOGISTICS as readonly string[]).includes(header.logistics_type as string) ? header.logistics_type as any : '海运';
    const safeCurrency = (VALID_CURRENCY as readonly string[]).includes(header.currency as string) ? header.currency as any : 'USD';

    // 用 React.createElement 构造根元素。项目已统一到 React 19，
    // 与 Next 15 内置 react-builtin 及 @react-pdf/reconciler(选 reconciler-33)
    // 的 react.transitional.element 符号一致，不再触发 error #31。
    const doc = createElement(QuotationPdf, {
      kind,
      company: company as CompanyProfile,
      customer: customer as Customer | null,
      items: items as QuotationItem[],
      summary,
      terms: filteredTerms as TermsTemplate[],
      meta: {
        quoteNo: String(header.quote_no ?? no),
        piNo: header.pi_no ?? undefined,
        date: String(header.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)),
        validUntil: String(header.valid_until ?? new Date().toISOString().slice(0, 10)),
        language: safeLang,
        currency: safeCurrency,
        incoterms: safeIncoterms,
        portOfLoading: String(header.port_of_loading ?? ''),
        portOfDestination: String(header.port_of_destination ?? ''),
        paymentTerms: String(header.payment_terms ?? ''),
        leadTime: String(header.lead_time ?? ''),
        logisticsCost: Number(header.logistics_cost ?? 0),
        logisticsType: safeLogistics,
        taxRate: Number(header.tax_rate ?? 0),
        insuranceRate: Number(header.insurance_rate ?? 0.003),
        otherCharges: Number(header.other_charges ?? 0),
        notes: String(header.notes ?? ''),
      },
    } as any);

    // 流式响应：@react-pdf 的 renderToStream 返回 Node.js Readable，
    // 用 Readable.toWeb 转成 Web ReadableStream 直接透传给客户端。
    // 这样绕过 Vercel Functions 4.5MB 响应体硬限制（FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE），
    // 同时避免把整份 PDF 缓存进内存。
    const nodeStream = (await renderToStream(doc as any)) as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${kind === 'pi' ? 'inline' : 'attachment'}; filename="${no}_${kind}_${safeLang}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    // 完整 dump 错误对象
    const dump = {
      error: 'PDF generation failed',
      detail: e?.message,
      name: e?.name,
      type: typeof e,
      stringified: (() => {
        try { return JSON.stringify(e, Object.getOwnPropertyNames(e ?? {})).slice(0, 3000); }
        catch { return String(e); }
      })(),
      stringified2: (() => {
        try { return JSON.stringify({ message: e?.message, stack: e?.stack, cause: e?.cause, ...e }, null, 2).slice(0, 3000); }
        catch { return String(e?.stack ?? ''); }
      })(),
    };
    console.error('[PDF error]', JSON.stringify(dump));
    return NextResponse.json(dump, { status: 500 });
  }
}
