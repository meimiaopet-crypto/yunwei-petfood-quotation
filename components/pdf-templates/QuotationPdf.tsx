/**
 * Quotation / PI PDF 模板（@react-pdf/renderer）
 * 支持中 / EN / VI 三语言 + 完整 PI 信息（银行账户/受益人/公章）
 * 不写 JSX，用 @react-pdf/renderer 的 Document/Page/Text/View 元素直接调用 renderToBuffer
 */
import * as React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { t, tIncoterm, tLogistics, formatMoney, formatDate } from '@/lib/i18n/outputTranslations';
import type { CompanyProfile, Customer, QuotationItem, TermsTemplate, Currency, Locale, Incoterm, LogisticsType } from '@/types';

// 字体（生产环境替换为本地 Noto Sans CJK）
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
  const lang = meta.language;
  const title = (kind === 'pi' ? t.proformaInvoice[lang] : t.quotation[lang]).toUpperCase();
  const termContent = (term: TermsTemplate) =>
    (lang === 'vi' ? term.content_vi : lang === 'en' ? term.content_en : term.content_zh) || term.content_en || '';

  // 列宽分配（合计 100%）
  const colW = {
    no: '4%', name: '26%', spec: '14%', qty: '8%', unit: '6%',
    ctns: '6%', price: '14%', amount: '14%', weight: '8%',
  } as const;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.row}>
            {company.logo_url
              ? <Image src={company.logo_url} style={{ width: 56, height: 56, marginRight: 10 }} />
              : <View style={styles.logo}><Text>YW</Text></View>}
            <View>
              <Text style={styles.companyName}>{lang === 'en' ? company.name_en : company.name_zh}</Text>
              <Text style={styles.companyInfo}>{lang === 'en' ? company.address_en : company.address_zh}</Text>
              <Text style={styles.contactLine}>{company.phone} · {company.email}</Text>
              {company.website && <Text style={styles.contactLine}>{company.website}</Text>}
            </View>
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.quoteNo}>{meta.quoteNo}</Text>
            {kind === 'pi' && meta.piNo && <Text style={styles.quoteNo}>PI: {meta.piNo}</Text>}
            <Text style={styles.date}>{t.date[lang]}: {formatDate(meta.date, lang)}</Text>
            <Text style={styles.date}>{t.validUntil[lang]}: {formatDate(meta.validUntil, lang)}</Text>
          </View>
        </View>

        {/* Bill To + Incoterms */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>{t.billTo[lang]}</Text>
            {customer ? (
              <>
                <Text style={{ fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{customer.company_name}</Text>
                {customer.contact_person && <Text style={{ fontSize: 8 }}>{t.contact[lang]}: {customer.contact_person}</Text>}
                {customer.address && <Text style={{ fontSize: 8, color: '#475569' }}>{customer.address}</Text>}
                {customer.phone && <Text style={{ fontSize: 8 }}>{t.tel[lang]}: {customer.phone}</Text>}
                {customer.whatsapp && <Text style={{ fontSize: 8 }}>WhatsApp: {customer.whatsapp}</Text>}
                {customer.email && <Text style={{ fontSize: 8 }}>{t.email[lang]}: {customer.email}</Text>}
              </>
            ) : <Text style={{ fontSize: 8, color: '#94a3b8' }}>—</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>{t.incoterms[lang]} / {t.portOfLoading[lang]}</Text>
            <Text style={{ fontSize: 8, marginBottom: 1 }}><Text style={{ color: '#64748B' }}>{t.incoterms[lang]}: </Text>{(tIncoterm as any)[meta.incoterms]?.[lang] ?? meta.incoterms}</Text>
            <Text style={{ fontSize: 8, marginBottom: 1 }}><Text style={{ color: '#64748B' }}>{t.portOfLoading[lang]}: </Text>{meta.portOfLoading}</Text>
            {meta.portOfDestination && <Text style={{ fontSize: 8, marginBottom: 1 }}><Text style={{ color: '#64748B' }}>{t.portOfDestination[lang]}: </Text>{meta.portOfDestination}</Text>}
            <Text style={{ fontSize: 8, marginBottom: 1 }}><Text style={{ color: '#64748B' }}>{t.leadTime[lang]}: </Text>{meta.leadTime}</Text>
            <Text style={{ fontSize: 8 }}><Text style={{ color: '#64748B' }}>{t.paymentTerms[lang]}: </Text>{meta.paymentTerms}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: colW.no }]}>{t.itemNo[lang]}</Text>
            <Text style={[styles.th, { width: colW.name }]}>{t.productName[lang]}</Text>
            <Text style={[styles.th, { width: colW.spec }]}>{t.specification[lang]}</Text>
            <Text style={[styles.th, { width: colW.qty, textAlign: 'right' }]}>{t.quantity[lang]}</Text>
            <Text style={[styles.th, { width: colW.unit }]}>{t.unit[lang]}</Text>
            <Text style={[styles.th, { width: colW.ctns, textAlign: 'right' }]}>{t.cartons[lang]}</Text>
            <Text style={[styles.th, { width: colW.price, textAlign: 'right' }]}>{t.unitPrice[lang]}</Text>
            <Text style={[styles.th, { width: colW.amount, textAlign: 'right' }]}>{t.amount[lang]}</Text>
          </View>
          {items.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.td, { width: '100%', textAlign: 'center', padding: 20, color: '#94a3b8' }]}>—</Text>
            </View>
          )}
          {items.map((it) => (
            <View key={it.line_no} style={styles.tableRow}>
              <Text style={[styles.td, { width: colW.no }]}>{it.line_no}</Text>
              <View style={{ width: colW.name, padding: 4 }}>
                <Text style={{ fontSize: 8, fontWeight: 700 }}>{it.product_name_output}</Text>
                <Text style={{ fontSize: 7, color: '#94a3b8' }}>{it.sku}</Text>
              </View>
              <Text style={[styles.td, { width: colW.spec, color: '#475569' }]}>{it.spec}</Text>
              <Text style={[styles.td, { width: colW.qty, textAlign: 'right' }]}>{it.quantity?.toLocaleString()}</Text>
              <Text style={[styles.td, { width: colW.unit }]}>{it.unit}</Text>
              <Text style={[styles.td, { width: colW.ctns, textAlign: 'right' }]}>{it.cartons}</Text>
              <Text style={[styles.td, { width: colW.price, textAlign: 'right' }]}>{formatMoney(it.unit_price, meta.currency, lang)}</Text>
              <Text style={[styles.td, { width: colW.amount, textAlign: 'right', fontWeight: 700 }]}>{formatMoney(it.total_price ?? 0, meta.currency, lang)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 9, color: '#64748B' }}>{t.subtotal[lang]}</Text>
            <Text style={{ fontSize: 9 }}>{formatMoney(summary.subtotal, meta.currency, lang)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontSize: 9, color: '#64748B' }}>{t.freight[lang]}{meta.logisticsType ? ` (${tLogistics[meta.logisticsType]?.[lang] ?? meta.logisticsType})` : ''}</Text>
            <Text style={{ fontSize: 9 }}>{formatMoney(meta.logisticsCost, meta.currency, lang)}</Text>
          </View>
          {summary.insurance > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: 9, color: '#64748B' }}>{t.insurance[lang]}</Text>
              <Text style={{ fontSize: 9 }}>{formatMoney(summary.insurance, meta.currency, lang)}</Text>
            </View>
          )}
          {meta.otherCharges > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: 9, color: '#64748B' }}>{t.otherCharges[lang]}</Text>
              <Text style={{ fontSize: 9 }}>{formatMoney(meta.otherCharges, meta.currency, lang)}</Text>
            </View>
          )}
          <View style={styles.totalLine}>
            <Text style={{ fontSize: 10, fontWeight: 700 }}>{t.totalAmount[lang]}</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{formatMoney(summary.total + meta.otherCharges, meta.currency, lang)}</Text>
          </View>
        </View>

        {/* Cargo info */}
        {items.length > 0 && (
          <View style={styles.cargoInfo}>
            <Text>{t.totalCartons[lang]}: <Text style={{ color: '#0F172A' }}>{summary.totalCartons}</Text></Text>
            <Text>{t.grossWeight[lang]}: <Text style={{ color: '#0F172A' }}>{summary.totalGrossWeight.toFixed(2)} kg</Text></Text>
            <Text>{t.measurement[lang]}: <Text style={{ color: '#0F172A' }}>{summary.totalCbm.toFixed(4)} CBM</Text></Text>
          </View>
        )}

        {/* PI: 银行账户 + 公章 */}
        {kind === 'pi' && company.bank_info && (
          <View style={styles.bankBox}>
            <Text style={{ ...styles.sectionTitle, marginBottom: 4 }}>{t.bankInfo[lang]}</Text>
            {company.bank_info.usd && (
              <>
                <Text style={styles.bankRow}><Text style={{ color: '#64748B' }}>{t.beneficiary[lang]}: </Text>{company.bank_info.usd.beneficiary}</Text>
                <Text style={styles.bankRow}><Text style={{ color: '#64748B' }}>{t.bankName[lang]}: </Text>{company.bank_info.usd.bank_name}</Text>
                <Text style={styles.bankRow}><Text style={{ color: '#64748B' }}>{t.accountNo[lang]}: </Text>{company.bank_info.usd.account_no}</Text>
                {company.bank_info.usd.swift && <Text style={styles.bankRow}><Text style={{ color: '#64748B' }}>{t.swiftCode[lang]}: </Text>{company.bank_info.usd.swift}</Text>}
              </>
            )}
          </View>
        )}

        {/* Notes & Terms */}
        {(meta.notes || terms.length > 0) && (
          <View style={{ marginTop: 14 }}>
            {meta.notes && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>{t.remarks[lang]}</Text>
                <Text style={{ fontSize: 8 }}>{meta.notes}</Text>
              </View>
            )}
            {terms.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>{t.termsAndConditions[lang]}</Text>
                {terms.map((term) => (
                  <Text key={term.id} style={{ fontSize: 8, marginBottom: 2 }}>
                    <Text style={{ fontWeight: 700 }}>· {term.name}：</Text>{termContent(term)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Signature / Seal */}
        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 8, color: '#64748B' }}>{t.validNotice[lang]} {formatDate(meta.validUntil, lang)}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 4 }}>{t.authorizedSignature[lang]}</Text>
            <View style={{ borderBottom: 0.5, borderBottomColor: '#0F172A', width: 160, height: 36 }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
              <View>
                <Text style={{ fontSize: 8, fontWeight: 700 }}>{lang === 'en' ? company.name_en : company.name_zh}</Text>
                <Text style={{ fontSize: 7, color: '#64748B' }}>{formatDate(meta.date, lang)}</Text>
              </View>
              {company.seal_url && <Image src={company.seal_url} style={[styles.seal, { marginLeft: 8 }]} />}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{lang === 'en' ? company.name_en : company.name_zh} · {company.email}</Text>
          <Text render={({ pageNumber, totalPages }) => `${t.pageNo[lang]} ${pageNumber} ${t.pageOf[lang]} ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
