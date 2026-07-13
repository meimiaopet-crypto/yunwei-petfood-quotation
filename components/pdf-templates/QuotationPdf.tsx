/**
 * Quotation / PI PDF 模板（@react-pdf/renderer）
 * 支持中 / EN / VI 三语言 + 完整 PI 信息（银行账户/受益人/公章）
 *
 * 关键：本文件**完全不写 JSX**，全部用 React.createElement 显式构造元素，
 * 因为 Next.js 15 把 react/jsx-runtime 替换成 react-rsc 版本，生成的 element
 * 标记是 {$$typeof, type, key, ref, props}（$$typeof 是 rsc 专用 symbol），
 * @react-pdf/renderer 4.x 的 reconciler-23 看到非标准 $$typeof 抛
 * Minified React error #31。React.createElement 永远产出标准 element 标记，
 * 不会走 jsx-runtime。
 */
import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { t, tIncoterm, tLogistics, formatMoney, formatDate } from '@/lib/i18n/outputTranslations';
import type { CompanyProfile, Customer, QuotationItem, TermsTemplate, Currency, Locale, Incoterm, LogisticsType } from '@/types';

// React.createElement 别名
const h = React.createElement;
const Fragment = React.Fragment;
const txt = (s: any) => s; // 文本节点的占位构造

// 字体
Font.register({
  family: 'Noto Sans CJK SC',
  src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYg.woff2',
});
Font.register({
  family: 'Noto Sans',
  src: 'https://fonts.gstatic.com/s/notosans/v28/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff2',
});

const styles = StyleSheet.create({
  page:    { padding: 36, fontSize: 9, fontFamily: 'Noto Sans CJK SC', color: '#0F172A' },
  row:     { flexDirection: 'row' },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 10, borderBottom: 2, borderBottomColor: '#2563EB' },
  logo:    { width: 56, height: 56, backgroundColor: '#2563EB', color: '#fff', fontSize: 22, fontWeight: 700, textAlign: 'center', paddingTop: 14, borderRadius: 6 },
  companyName: { fontSize: 13, fontWeight: 700 },
  companyInfo: { fontSize: 8, color: '#64748B', marginTop: 2, maxWidth: 240 },
  contactLine: { fontSize: 8, color: '#64748B', marginTop: 1 },
  title:   { fontSize: 22, color: '#2563EB', fontWeight: 700, letterSpacing: 1.5 },
  quoteNo: { fontSize: 10, fontFamily: 'Courier', marginTop: 4 },
  date:    { fontSize: 8, color: '#64748B', marginTop: 4 },

  sectionTitle: { fontSize: 8, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  twoCol: { flexDirection: 'row', gap: 16, marginTop: 14 },
  col:    { flex: 1 },

  table:    { width: '100%', marginTop: 12, borderStyle: 'solid', borderWidth: 0.5, borderColor: '#E2E8F0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#EFF6FF', fontWeight: 700, paddingVertical: 4 },
  tableRow:    { flexDirection: 'row', borderTop: 0.5, borderTopColor: '#E2E8F0' },
  th:  { padding: 4, fontSize: 8 },
  td:  { padding: 4, fontSize: 8 },

  summaryBox: { width: 240, marginLeft: 'auto', marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  totalLine:  { borderTop: 1.5, borderTopColor: '#2563EB', marginTop: 4, paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' },

  cargoInfo: { fontSize: 8, color: '#64748B', flexDirection: 'row', gap: 12, marginTop: 8, paddingHorizontal: 4 },
  bankBox:   { marginTop: 10, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 4 },
  bankRow:   { flexDirection: 'row', fontSize: 8, marginBottom: 1 },
  seal:      { width: 80, height: 80, marginTop: 4 },

  footer:    { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#64748B', borderTop: 0.5, borderTopColor: '#E2E8F0', paddingTop: 8 },
});

interface PdfMeta {
  quoteNo: string; piNo?: string; date: string; validUntil: string;
  language: Locale; currency: Currency; incoterms: Incoterm;
  portOfLoading: string; portOfDestination: string;
  paymentTerms: string; leadTime: string;
  logisticsCost: number; logisticsType: LogisticsType;
  taxRate: number; insuranceRate: number; otherCharges: number;
  notes: string;
}
interface PdfSummary {
  subtotal: number; total: number; insurance: number;
  totalCartons: number; totalGrossWeight: number; totalCbm: number;
}

export interface PdfProps {
  kind: 'quotation' | 'pi';
  company: CompanyProfile;
  customer: Customer | null;
  items: QuotationItem[];
  summary: PdfSummary;
  meta: PdfMeta;
  terms: TermsTemplate[];
}

export function QuotationPdf({ kind, company, customer, items, summary, meta, terms }: PdfProps) {
  const lang: Locale = meta.language;
  const title: string = (kind === 'pi' ? t.proformaInvoice[lang] : t.quotation[lang]).toUpperCase();
  const termContent = (term: TermsTemplate): string =>
    (lang === 'vi' ? term.content_vi : lang === 'en' ? term.content_en : term.content_zh) || term.content_en || '';

  const colW = {
    no: '4%', name: '26%', spec: '14%', qty: '8%', unit: '6%',
    ctns: '6%', price: '14%', amount: '14%', weight: '8%',
  } as const;

  // === 构造整个 PDF 文档（全部用 React.createElement） ===
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      // ----- Header -----
      h(
        View,
        { style: styles.header },
        h(
          View,
          { style: styles.row },
          company.logo_url
            ? h(Image, { src: company.logo_url, style: { width: 56, height: 56, marginRight: 10 } })
            : h(View, { style: styles.logo }, h(Text, null, 'YW')),
          h(
            View,
            null,
            h(Text, { style: styles.companyName }, lang === 'en' ? company.name_en : company.name_zh),
            h(Text, { style: styles.companyInfo }, lang === 'en' ? company.address_en : company.address_zh),
            h(Text, { style: styles.contactLine }, `${company.phone ?? ''} · ${company.email ?? ''}`),
            company.website ? h(Text, { style: styles.contactLine }, company.website) : null,
          ),
        ),
        h(
          View,
          null,
          h(Text, { style: styles.title }, title),
          h(Text, { style: styles.quoteNo }, meta.quoteNo),
          kind === 'pi' && meta.piNo ? h(Text, { style: styles.quoteNo }, `PI: ${meta.piNo}`) : null,
          h(Text, { style: styles.date }, `${t.date[lang]}: ${formatDate(meta.date, lang)}`),
          h(Text, { style: styles.date }, `${t.validUntil[lang]}: ${formatDate(meta.validUntil, lang)}`),
        ),
      ),
      // ----- Bill To + Incoterms -----
      h(
        View,
        { style: styles.twoCol },
        // 左列：客户
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.sectionTitle }, t.billTo[lang]),
          customer
            ? h(
                Fragment,
                null,
                h(Text, { style: { fontSize: 9, fontWeight: 700, marginBottom: 2 } }, customer.company_name),
                customer.contact_person
                  ? h(Text, { style: { fontSize: 8 } }, `${t.contact[lang]}: ${customer.contact_person}`)
                  : null,
                customer.address
                  ? h(Text, { style: { fontSize: 8, color: '#475569' } }, customer.address)
                  : null,
                customer.phone ? h(Text, { style: { fontSize: 8 } }, `${t.tel[lang]}: ${customer.phone}`) : null,
                customer.whatsapp ? h(Text, { style: { fontSize: 8 } }, `WhatsApp: ${customer.whatsapp}`) : null,
                customer.email ? h(Text, { style: { fontSize: 8 } }, `${t.email[lang]}: ${customer.email}`) : null,
              )
            : h(Text, { style: { fontSize: 8, color: '#94a3b8' } }, '—'),
        ),
        // 右列：贸易条件
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.sectionTitle }, `${t.incoterms[lang]} / ${t.portOfLoading[lang]}`),
          h(
            Text,
            { style: { fontSize: 8, marginBottom: 1 } },
            h(Text, { style: { color: '#64748B' } }, `${t.incoterms[lang]}: `),
            (tIncoterm as any)[meta.incoterms]?.[lang] ?? meta.incoterms,
          ),
          h(
            Text,
            { style: { fontSize: 8, marginBottom: 1 } },
            h(Text, { style: { color: '#64748B' } }, `${t.portOfLoading[lang]}: `),
            meta.portOfLoading,
          ),
          meta.portOfDestination
            ? h(
                Text,
                { style: { fontSize: 8, marginBottom: 1 } },
                h(Text, { style: { color: '#64748B' } }, `${t.portOfDestination[lang]}: `),
                meta.portOfDestination,
              )
            : null,
          h(
            Text,
            { style: { fontSize: 8, marginBottom: 1 } },
            h(Text, { style: { color: '#64748B' } }, `${t.leadTime[lang]}: `),
            meta.leadTime,
          ),
          h(
            Text,
            { style: { fontSize: 8 } },
            h(Text, { style: { color: '#64748B' } }, `${t.paymentTerms[lang]}: `),
            meta.paymentTerms,
          ),
        ),
      ),
      // ----- Items Table -----
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: styles.tableHeader },
          h(Text, { style: [styles.th, { width: colW.no }] }, t.itemNo[lang]),
          h(Text, { style: [styles.th, { width: colW.name }] }, t.productName[lang]),
          h(Text, { style: [styles.th, { width: colW.spec }] }, t.specification[lang]),
          h(Text, { style: [styles.th, { width: colW.qty, textAlign: 'right' }] }, t.quantity[lang]),
          h(Text, { style: [styles.th, { width: colW.unit }] }, t.unit[lang]),
          h(Text, { style: [styles.th, { width: colW.ctns, textAlign: 'right' }] }, t.cartons[lang]),
          h(Text, { style: [styles.th, { width: colW.price, textAlign: 'right' }] }, t.unitPrice[lang]),
          h(Text, { style: [styles.th, { width: colW.amount, textAlign: 'right' }] }, t.amount[lang]),
        ),
        items.length === 0
          ? h(
              View,
              { style: styles.tableRow },
              h(Text, { style: [styles.td, { width: '100%', textAlign: 'center', padding: 20, color: '#94a3b8' }] }, '—'),
            )
          : null,
        ...items.map((it) =>
          h(
            View,
            { key: it.line_no, style: styles.tableRow },
            h(Text, { style: [styles.td, { width: colW.no }] }, String(it.line_no)),
            h(
              View,
              { style: { width: colW.name, padding: 4 } },
              h(Text, { style: { fontSize: 8, fontWeight: 700 } }, it.product_name_output),
              h(Text, { style: { fontSize: 7, color: '#94a3b8' } }, it.sku),
            ),
            h(Text, { style: [styles.td, { width: colW.spec, color: '#475569' }] }, it.spec),
            h(Text, { style: [styles.td, { width: colW.qty, textAlign: 'right' }] }, it.quantity?.toLocaleString()),
            h(Text, { style: [styles.td, { width: colW.unit }] }, it.unit),
            h(Text, { style: [styles.td, { width: colW.ctns, textAlign: 'right' }] }, String(it.cartons)),
            h(Text, { style: [styles.td, { width: colW.price, textAlign: 'right' }] }, formatMoney(it.unit_price, meta.currency, lang)),
            h(Text, { style: [styles.td, { width: colW.amount, textAlign: 'right', fontWeight: 700 }] }, formatMoney(it.total_price ?? 0, meta.currency, lang)),
          ),
        ),
      ),
      // ----- Summary -----
      h(
        View,
        { style: styles.summaryBox },
        h(
          View,
          { style: styles.summaryRow },
          h(Text, { style: { fontSize: 9, color: '#64748B' } }, t.subtotal[lang]),
          h(Text, { style: { fontSize: 9 } }, formatMoney(summary.subtotal, meta.currency, lang)),
        ),
        h(
          View,
          { style: styles.summaryRow },
          h(
            Text,
            { style: { fontSize: 9, color: '#64748B' } },
            `${t.freight[lang]}${meta.logisticsType ? ` (${(tLogistics as any)[meta.logisticsType]?.[lang] ?? meta.logisticsType})` : ''}`,
          ),
          h(Text, { style: { fontSize: 9 } }, formatMoney(meta.logisticsCost, meta.currency, lang)),
        ),
        summary.insurance > 0
          ? h(
              View,
              { style: styles.summaryRow },
              h(Text, { style: { fontSize: 9, color: '#64748B' } }, t.insurance[lang]),
              h(Text, { style: { fontSize: 9 } }, formatMoney(summary.insurance, meta.currency, lang)),
            )
          : null,
        meta.otherCharges > 0
          ? h(
              View,
              { style: styles.summaryRow },
              h(Text, { style: { fontSize: 9, color: '#64748B' } }, t.otherCharges[lang]),
              h(Text, { style: { fontSize: 9 } }, formatMoney(meta.otherCharges, meta.currency, lang)),
            )
          : null,
        h(
          View,
          { style: styles.totalLine },
          h(Text, { style: { fontSize: 10, fontWeight: 700 } }, t.totalAmount[lang]),
          h(Text, { style: { fontSize: 12, fontWeight: 700, color: '#2563EB' } }, formatMoney(summary.total + meta.otherCharges, meta.currency, lang)),
        ),
      ),
      // ----- Cargo info -----
      items.length > 0
        ? h(
            View,
            { style: styles.cargoInfo },
            h(
              Text,
              null,
              `${t.totalCartons[lang]}: `,
              h(Text, { style: { color: '#0F172A' } }, String(summary.totalCartons)),
            ),
            h(
              Text,
              null,
              `${t.grossWeight[lang]}: `,
              h(Text, { style: { color: '#0F172A' } }, `${summary.totalGrossWeight.toFixed(2)} kg`),
            ),
            h(
              Text,
              null,
              `${t.measurement[lang]}: `,
              h(Text, { style: { color: '#0F172A' } }, `${summary.totalCbm.toFixed(4)} CBM`),
            ),
          )
        : null,
      // ----- Bank info (PI only) -----
      kind === 'pi' && company.bank_info
        ? h(
            View,
            { style: styles.bankBox },
            h(Text, { style: { ...styles.sectionTitle, marginBottom: 4 } }, t.bankInfo[lang]),
            company.bank_info.usd
              ? h(
                  Fragment,
                  null,
                  h(
                    Text,
                    { style: styles.bankRow },
                    h(Text, { style: { color: '#64748B' } }, `${t.beneficiary[lang]}: `),
                    company.bank_info.usd.beneficiary,
                  ),
                  h(
                    Text,
                    { style: styles.bankRow },
                    h(Text, { style: { color: '#64748B' } }, `${t.bankName[lang]}: `),
                    company.bank_info.usd.bank_name,
                  ),
                  h(
                    Text,
                    { style: styles.bankRow },
                    h(Text, { style: { color: '#64748B' } }, `${t.accountNo[lang]}: `),
                    company.bank_info.usd.account_no,
                  ),
                  company.bank_info.usd.swift
                    ? h(
                        Text,
                        { style: styles.bankRow },
                        h(Text, { style: { color: '#64748B' } }, `${t.swiftCode[lang]}: `),
                        company.bank_info.usd.swift,
                      )
                    : null,
                )
              : null,
          )
        : null,
      // ----- Notes & Terms -----
      meta.notes || terms.length > 0
        ? h(
            View,
            { style: { marginTop: 14 } },
            meta.notes
              ? h(
                  View,
                  { style: { marginBottom: 6 } },
                  h(Text, { style: styles.sectionTitle }, t.remarks[lang]),
                  h(Text, { style: { fontSize: 8 } }, meta.notes),
                )
              : null,
            terms.length > 0
              ? h(
                  View,
                  null,
                  h(Text, { style: styles.sectionTitle }, t.termsAndConditions[lang]),
                  ...terms.map((term) =>
                    h(
                      Text,
                      { key: term.id, style: { fontSize: 8, marginBottom: 2 } },
                      h(Text, { style: { fontWeight: 700 } }, `· ${term.name}：${termContent(term)}`),
                    ),
                  ),
                )
              : null,
          )
        : null,
      // ----- Signature / Seal -----
      h(
        View,
        { style: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' } },
        h(
          View,
          null,
          h(Text, { style: { fontSize: 8, color: '#64748B' } }, `${t.validNotice[lang]} ${formatDate(meta.validUntil, lang)}`),
        ),
        h(
          View,
          null,
          h(Text, { style: { fontSize: 8, color: '#64748B', marginBottom: 4 } }, t.authorizedSignature[lang]),
          h(View, { style: { borderBottom: 0.5, borderBottomColor: '#0F172A', width: 160, height: 36 } }),
          h(
            View,
            { style: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 } },
            h(
              View,
              null,
              h(Text, { style: { fontSize: 8, fontWeight: 700 } }, lang === 'en' ? company.name_en : company.name_zh),
              h(Text, { style: { fontSize: 7, color: '#64748B' } }, formatDate(meta.date, lang)),
            ),
            company.seal_url ? h(Image, { src: company.seal_url, style: [styles.seal, { marginLeft: 8 }] }) : null,
          ),
        ),
      ),
      // ----- Footer -----
      h(
        View,
        { style: styles.footer, fixed: true } as any,
        h(Text, null, `${lang === 'en' ? company.name_en : company.name_zh} · ${company.email ?? ''}`),
        h(Text, { render: ({ pageNumber, totalPages }: any) => `${t.pageNo[lang]} ${pageNumber} ${t.pageOf[lang]} ${totalPages}` } as any),
      ),
    ),
  );
}
