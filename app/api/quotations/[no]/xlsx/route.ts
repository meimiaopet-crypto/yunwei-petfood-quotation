/**
 * GET /api/quotations/[no]/xlsx?lang=en
 * Excel 导出（SheetJS）
 */
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { summarizeQuotation } from '@/lib/calculations/priceEngine';
import { t, tIncoterm, formatMoney } from '@/lib/i18n/outputTranslations';
import type { Locale, QuotationItem } from '@/types';

export const runtime = 'nodejs';

const LANG_HEADER: Record<Locale, Record<string, string>> = {
  zh: { quoteNo: '报价单号', date: '日期', validUntil: '有效期至', customer: '客户', product: '产品名称', spec: '规格', qty: '数量', unit: '单位', ctns: '箱数', price: '单价', amount: '金额' },
  en: { quoteNo: 'Quote No.', date: 'Date', validUntil: 'Valid Until', customer: 'Customer', product: 'Product Name', spec: 'Specification', qty: 'Qty', unit: 'Unit', ctns: 'Ctns', price: 'Unit Price', amount: 'Amount' },
  vi: { quoteNo: 'Số báo giá', date: 'Ngày', validUntil: 'Có hiệu lực đến', customer: 'Khách hàng', product: 'Tên sản phẩm', spec: 'Quy cách', qty: 'Số lượng', unit: 'Đơn vị', ctns: 'Số thùng', price: 'Đơn giá', amount: 'Thành tiền' },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ no: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  const { no } = await params;
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'en') as Locale;
  const H = LANG_HEADER[lang];

  try {
    const sb = getBrowserSupabase();
    const { data: header } = await sb.from('quotations').select('*').eq('quote_no', no).single();
    if (!header) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const [{ data: items }, { data: customer }] = await Promise.all([
      sb.from('quotation_items').select('*').eq('quotation_id', header.id).order('line_no'),
      sb.from('customers').select('*').eq('id', header.customer_id).single(),
    ]);

    const summary = summarizeQuotation({
      items: (items ?? []) as QuotationItem[],
      logisticsCost: Number(header.logistics_cost ?? 0),
      insuranceRate: Number(header.insurance_rate ?? 0.003),
      taxRate: Number(header.tax_rate ?? 0),
      incoterms: header.incoterms as any,
      exchangeRate: Number(header.exchange_rate ?? 1),
    });

    // Sheet 1 — Quotation
    const ws1 = XLSX.utils.aoa_to_sheet([
      [H.quoteNo, header.quote_no],
      [H.date, header.created_at?.slice(0, 10)],
      [H.validUntil, header.valid_until],
      [H.customer, customer?.company_name ?? ''],
      ['Incoterms', `${header.incoterms} ${header.port_of_loading} → ${header.port_of_destination ?? ''}`],
      [],
      ['', H.product, H.spec, H.qty, H.unit, H.ctns, H.price, H.amount],
      ...((items ?? []) as QuotationItem[]).map((it, i) => [
        i + 1, it.product_name_output, it.spec, it.quantity, it.unit, it.cartons, it.unit_price, it.total_price,
      ]),
      [],
      ['', '', '', '', '', '', 'Subtotal', summary.subtotal],
      ['', '', '', '', '', '', 'Freight', header.logistics_cost],
      ['', '', '', '', '', '', 'Insurance', summary.insurance],
      ['', '', '', '', '', '', 'TOTAL', summary.total + Number(header.other_charges ?? 0)],
    ]);
    ws1['!cols'] = [{ wch: 4 }, { wch: 36 }, { wch: 24 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 14 }];
    const ws2 = XLSX.utils.aoa_to_sheet([
      [lang === 'zh' ? '货物信息' : lang === 'vi' ? 'Thông tin hàng hóa' : 'Cargo Information'],
      [lang === 'zh' ? '总箱数' : 'Total Cartons', summary.totalCartons],
      [lang === 'zh' ? '总毛重(kg)' : 'Gross Weight (kg)', summary.totalGrossWeight],
      [lang === 'zh' ? '总体积(CBM)' : 'Measurement (CBM)', summary.totalCbm],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Quotation');
    XLSX.utils.book_append_sheet(wb, ws2, 'Cargo');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${no}_${lang}.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Excel generation failed', detail: e?.message }, { status: 500 });
  }
}
