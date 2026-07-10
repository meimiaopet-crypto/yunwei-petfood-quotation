'use client';
import * as React from 'react';
import type { Customer, QuotationItem, CompanyProfile, TermsTemplate, Currency, Locale, Incoterm, LogisticsType } from '@/types';
import { t, tIncoterm, tLogistics, formatMoney, formatDate } from '@/lib/i18n/outputTranslations';

interface Summary {
  subtotal: number; total: number; insurance: number;
  totalCartons: number; totalGrossWeight: number; totalCbm: number;
  totalProfit: number; totalMargin: number;
}
interface Meta {
  quoteNo: string; date: string; validUntil: string;
  language: Locale; currency: Currency; incoterms: Incoterm;
  portOfLoading: string; portOfDestination: string;
  paymentTerms: string; leadTime: string;
  logisticsCost: number; logisticsType: LogisticsType;
  taxRate: number; insuranceRate: number; otherCharges: number;
  notes: string;
}

export function QuotationPreview({
  company, customer, items, summary, meta, terms, showProfit = false,
}: {
  company: CompanyProfile | null;
  customer: Customer | null;
  items: QuotationItem[];
  summary: Summary;
  meta: Meta;
  terms: TermsTemplate[];
  showProfit?: boolean;
}) {
  const lang = meta.language;
  const locale = lang;
  const termContent = (term: TermsTemplate) =>
    (lang === 'vi' ? term.content_vi : lang === 'en' ? term.content_en : term.content_zh) || term.content_en || '';

  return (
    <div className="bg-white shadow-md mx-auto" style={{ width: '100%', maxWidth: 760, minHeight: 1000, padding: '40px 48px' }}>
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-brand">
        <div className="flex items-center gap-3">
          {company?.logo_url ? (
            <img src={company.logo_url} alt="logo" className="w-14 h-14 object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg">YW</div>
          )}
          <div>
            <div className="text-base font-bold text-foreground">{lang === 'en' ? company?.name_en : company?.name_zh}</div>
            <div className="text-xs text-muted mt-1 max-w-xs">{lang === 'en' ? company?.address_en : company?.address_zh}</div>
            <div className="text-xs text-muted mt-0.5">{company?.phone} · {company?.email}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand tracking-wider">{t.quotation[lang]}</div>
          <div className="text-sm font-mono mt-1">{meta.quoteNo}</div>
          <div className="text-xs text-muted mt-2">{t.date[lang]}: {formatDate(meta.date, lang)}</div>
          <div className="text-xs text-muted">{t.validUntil[lang]}: {formatDate(meta.validUntil, lang)}</div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider mb-1.5">{t.billTo[lang]}</div>
          {customer ? (
            <div className="text-sm space-y-0.5">
              <div className="font-semibold">{customer.company_name}</div>
              {customer.contact_person && <div>{t.contact[lang]}: {customer.contact_person}</div>}
              {customer.address && <div className="text-muted">{customer.address}</div>}
              {customer.phone && <div>{t.tel[lang]}: {customer.phone}</div>}
              {customer.whatsapp && <div>WhatsApp: {customer.whatsapp}</div>}
              {customer.email && <div>{t.email[lang]}: {customer.email}</div>}
            </div>
          ) : (
            <div className="text-sm text-muted italic">—</div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted uppercase tracking-wider mb-1.5">{t.incoterms[lang]} & {t.portOfLoading[lang]}</div>
          <div className="text-sm space-y-0.5">
            <div><span className="text-muted">{t.incoterms[lang]}:</span> <span className="font-medium">{tIncoterm[meta.incoterms][lang]}</span></div>
            <div><span className="text-muted">{t.portOfLoading[lang]}:</span> {meta.portOfLoading}</div>
            {meta.portOfDestination && <div><span className="text-muted">{t.portOfDestination[lang]}:</span> {meta.portOfDestination}</div>}
            <div><span className="text-muted">{t.leadTime[lang]}:</span> {meta.leadTime}</div>
            <div><span className="text-muted">{t.paymentTerms[lang]}:</span> {meta.paymentTerms}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-5">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#EFF6FF' }}>
              {[t.itemNo[lang], t.productName[lang], t.specification[lang], t.quantity[lang], t.unit[lang], t.cartons[lang], t.unitPrice[lang], t.amount[lang]].map((h, i) => (
                <th key={i} className="text-left font-semibold py-2 px-2" style={{ borderBottom: '1px solid #CBD5E1' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-10">— 添加产品后此处显示明细 —</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.line_no} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td className="py-2 px-2">{it.line_no}</td>
                <td className="py-2 px-2">
                  <div className="font-medium">{it.product_name_output}</div>
                  {showProfit && <div className="text-[10px] text-orange-500">{((it.unit_price - (it.cost_price ?? 0)) / (it.unit_price || 1) * 100).toFixed(1)}% margin</div>}
                </td>
                <td className="py-2 px-2 text-muted">{it.spec}</td>
                <td className="py-2 px-2 text-right tabular-nums">{it.quantity?.toLocaleString()}</td>
                <td className="py-2 px-2">{it.unit}</td>
                <td className="py-2 px-2 text-right tabular-nums">{it.cartons}</td>
                <td className="py-2 px-2 text-right tabular-nums">{formatMoney(it.unit_price, meta.currency, lang)}</td>
                <td className="py-2 px-2 text-right tabular-nums font-medium">{formatMoney(it.total_price ?? 0, meta.currency, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex justify-end">
        <div className="w-72 text-sm space-y-1">
          <Row label={t.subtotal[lang]} value={formatMoney(summary.subtotal, meta.currency, lang)} />
          <Row label={`${t.freight[lang]} (${tLogistics[meta.logisticsType][lang]})`} value={formatMoney(meta.logisticsCost, meta.currency, lang)} />
          {summary.insurance > 0 && <Row label={t.insurance[lang]} value={formatMoney(summary.insurance, meta.currency, lang)} />}
          {meta.otherCharges > 0 && <Row label={t.otherCharges[lang]} value={formatMoney(meta.otherCharges, meta.currency, lang)} />}
          <div className="border-t-2 border-brand pt-1.5 mt-1.5 flex items-center justify-between">
            <div className="font-semibold text-base">{t.totalAmount[lang]}</div>
            <div className="font-bold text-lg text-brand tabular-nums">{formatMoney(summary.total + meta.otherCharges, meta.currency, lang)}</div>
          </div>
          {showProfit && (
            <div className="text-xs text-orange-600 flex items-center justify-between pt-1">
              <span>内部：{summary.totalMargin.toFixed(1)}%</span>
              <span>利润 {formatMoney(summary.totalProfit, meta.currency, lang)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cargo info */}
      {items.length > 0 && (
        <div className="mt-3 text-xs text-muted flex gap-4 px-2">
          <span>{t.totalCartons[lang]}: <strong className="text-foreground">{summary.totalCartons}</strong></span>
          <span>{t.grossWeight[lang]}: <strong className="text-foreground">{summary.totalGrossWeight.toFixed(2)} kg</strong></span>
          <span>{t.measurement[lang]}: <strong className="text-foreground">{summary.totalCbm.toFixed(4)} CBM</strong></span>
        </div>
      )}

      {/* Terms & Notes */}
      {(meta.notes || terms.length > 0) && (
        <div className="mt-6 space-y-3">
          {meta.notes && (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">{t.remarks[lang]}</div>
              <div className="text-xs whitespace-pre-wrap">{meta.notes}</div>
            </div>
          )}
          {terms.length > 0 && (
            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">{t.termsAndConditions[lang]}</div>
              <div className="text-xs space-y-1.5">
                {terms.map((term) => (
                  <div key={term.id} className="leading-relaxed">
                    <strong>· {term.name}：</strong>{termContent(term)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border flex items-end justify-between">
        <div className="text-xs text-muted">{t.validNotice[lang]} {formatDate(meta.validUntil, lang)}</div>
        <div className="text-right">
          <div className="text-xs text-muted mb-1">{t.authorizedSignature[lang]}</div>
          <div className="border-b border-foreground/30 w-40 h-12"></div>
          <div className="text-xs mt-1">{lang === 'en' ? company?.name_en : company?.name_zh}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
