/**
 * 报价单输出字段三语言映射（zh / en / vi）
 * 与 CodeX Prompt 第七章保持一致
 */
import type { Locale, Currency, Incoterm, QuotationStatus, LogisticsType } from '@/types';

type Tr = Record<Locale, string>;

export const t = {
  // 文件标题
  quotation:       { zh: '报价单',     en: 'QUOTATION',        vi: 'BẢNG BÁO GIÁ' } as Tr,
  proformaInvoice: { zh: '形式发票',   en: 'PROFORMA INVOICE', vi: 'HÓA ĐƠN TẠM TÍNH' } as Tr,

  // 字段标签
  quoteNo:           { zh: '报价单号',     en: 'Quote No.',          vi: 'Số báo giá' } as Tr,
  piNo:              { zh: 'PI 编号',      en: 'PI No.',             vi: 'Số PI' } as Tr,
  date:              { zh: '日期',         en: 'Date',               vi: 'Ngày' } as Tr,
  validUntil:        { zh: '有效期至',     en: 'Valid Until',        vi: 'Có hiệu lực đến' } as Tr,
  billTo:            { zh: '客户信息',     en: 'Bill To',            vi: 'Khách hàng' } as Tr,
  contact:           { zh: '联系人',       en: 'Contact',            vi: 'Người liên hệ' } as Tr,
  tel:               { zh: '电话',         en: 'Tel',                vi: 'Điện thoại' } as Tr,
  whatsapp:          { zh: 'WhatsApp',     en: 'WhatsApp',           vi: 'WhatsApp' } as Tr,
  email:             { zh: '邮箱',         en: 'Email',              vi: 'Email' } as Tr,
  address:           { zh: '地址',         en: 'Address',            vi: 'Địa chỉ' } as Tr,
  incoterms:         { zh: '贸易条款',     en: 'Incoterms',          vi: 'Điều kiện thương mại' } as Tr,
  portOfLoading:     { zh: '装货港',       en: 'Port of Loading',    vi: 'Cảng xếp hàng' } as Tr,
  portOfDestination: { zh: '目的港',       en: 'Port of Destination',vi: 'Cảng đến' } as Tr,
  paymentTerms:      { zh: '付款条件',     en: 'Payment Terms',      vi: 'Điều kiện thanh toán' } as Tr,
  leadTime:          { zh: '交货期',       en: 'Lead Time',          vi: 'Thời gian giao hàng' } as Tr,

  // 产品明细表头
  itemNo:        { zh: '序号',     en: 'No.',           vi: 'STT' } as Tr,
  productName:   { zh: '产品名称', en: 'Product Name',  vi: 'Tên sản phẩm' } as Tr,
  specification: { zh: '规格',     en: 'Specification', vi: 'Quy cách' } as Tr,
  quantity:      { zh: '数量',     en: 'Qty',           vi: 'Số lượng' } as Tr,
  unit:          { zh: '单位',     en: 'Unit',          vi: 'Đơn vị' } as Tr,
  cartons:       { zh: '箱数',     en: 'Ctns',          vi: 'Số thùng' } as Tr,
  unitPrice:     { zh: '单价',     en: 'Unit Price',    vi: 'Đơn giá' } as Tr,
  amount:        { zh: '金额',     en: 'Amount',        vi: 'Thành tiền' } as Tr,

  // 汇总
  subtotal:      { zh: '小计',     en: 'Subtotal',     vi: 'Tổng phụ' } as Tr,
  freight:       { zh: '运费',     en: 'Freight',      vi: 'Cước vận chuyển' } as Tr,
  insurance:     { zh: '保险费',   en: 'Insurance',    vi: 'Phí bảo hiểm' } as Tr,
  otherCharges:  { zh: '其他费用', en: 'Other Charges',vi: 'Chi phí khác' } as Tr,
  totalAmount:   { zh: '总金额',   en: 'Total Amount', vi: 'Tổng cộng' } as Tr,

  // 货物信息
  totalCartons:  { zh: '总箱数',   en: 'Total Cartons',vi: 'Tổng số thùng' } as Tr,
  grossWeight:   { zh: '总毛重',   en: 'Gross Weight', vi: 'Tổng trọng lượng' } as Tr,
  measurement:   { zh: '总体积',   en: 'Measurement',  vi: 'Thể tích' } as Tr,

  // 备注 & 签章
  remarks:           { zh: '备注',           en: 'Remarks',            vi: 'Ghi chú' } as Tr,
  termsAndConditions: { zh: '条款与条件',     en: 'Terms & Conditions', vi: 'Điều khoản & Điều kiện' } as Tr,
  authorizedSignature: { zh: '授权签字',     en: 'Authorized Signature',vi: 'Chữ ký ủy quyền' } as Tr,
  companySeal:       { zh: '公司签章',       en: 'Company Seal',       vi: 'Con dấu công ty' } as Tr,
  bankInfo:          { zh: '银行账户',       en: 'Banking Information',vi: 'Thông tin ngân hàng' } as Tr,
  beneficiary:       { zh: '受益人',         en: 'Beneficiary',        vi: 'Người thụ hưởng' } as Tr,
  bankName:          { zh: '开户行',         en: 'Bank Name',          vi: 'Tên ngân hàng' } as Tr,
  accountNo:         { zh: '账号',           en: 'A/C No.',            vi: 'Số tài khoản' } as Tr,
  swiftCode:         { zh: 'SWIFT',          en: 'SWIFT',              vi: 'SWIFT' } as Tr,

  validNotice: { zh: '本报价单有效期至', en: 'This quotation is valid until', vi: 'Báo giá có hiệu lực đến' } as Tr,
  pageNo:      { zh: '第',               en: 'Page',                vi: 'Trang' } as Tr,
  pageOf:      { zh: '页，共',           en: 'of',                  vi: '/trang' } as Tr,
};

export const tIncoterm: Record<Incoterm, Tr> = {
  FOB: { zh: 'FOB 船上交货',   en: 'FOB Free On Board',     vi: 'FOB Giao lên tàu' },
  CIF: { zh: 'CIF 成本+保险+运费', en: 'CIF Cost, Insurance & Freight', vi: 'CIF Giá thành, Bảo hiểm & Cước' },
  CFR: { zh: 'CFR 成本+运费',  en: 'CFR Cost & Freight',    vi: 'CFR Giá thành & Cước' },
  EXW: { zh: 'EXW 工厂交货',   en: 'EXW Ex Works',          vi: 'EXW Tại xưởng' },
};

export const tStatus: Record<QuotationStatus, Tr> = {
  草稿:    { zh: '草稿',    en: 'Draft',           vi: 'Bản nháp' },
  已发送:  { zh: '已发送',  en: 'Sent',            vi: 'Đã gửi' },
  谈判中:  { zh: '谈判中',  en: 'Negotiating',     vi: 'Đang đàm phán' },
  赢单:    { zh: '赢单',    en: 'Won',             vi: 'Thắng' },
  输单:    { zh: '输单',    en: 'Lost',            vi: 'Thua' },
  过期:    { zh: '过期',    en: 'Expired',         vi: 'Hết hạn' },
  已改版:  { zh: '已改版',  en: 'Revised',         vi: 'Đã sửa đổi' },
};

export const tLogistics: Record<LogisticsType, Tr> = {
  海运: { zh: '海运', en: 'Sea',   vi: 'Đường biển' },
  空运: { zh: '空运', en: 'Air',   vi: 'Đường hàng không' },
  陆运: { zh: '陆运', en: 'Land',  vi: 'Đường bộ' },
};

export const tCurrency: Record<Currency, Tr> = {
  USD: { zh: '美元', en: 'USD',  vi: 'USD' },
  CNY: { zh: '人民币', en: 'CNY', vi: 'CNY' },
  VND: { zh: '越南盾', en: 'VND', vi: 'VND' },
  MYR: { zh: '马来西亚林吉特', en: 'MYR', vi: 'MYR' },
  THB: { zh: '泰铢', en: 'THB', vi: 'THB' },
  SAR: { zh: '沙特里亚尔', en: 'SAR', vi: 'SAR' },
  AED: { zh: '迪拉姆', en: 'AED', vi: 'AED' },
};

export function formatMoney(value: number, currency: Currency = 'USD', locale: Locale = 'zh'): string {
  const symbolMap: Record<Currency, Record<Locale, string>> = {
    USD: { zh: 'USD ',  en: 'USD ', vi: 'USD ' },
    CNY: { zh: '¥',     en: 'CNY ',vi: 'CNY ' },
    VND: { zh: '₫',     en: 'VND ',vi: 'đ' },
    MYR: { zh: 'RM ',   en: 'MYR ',vi: 'RM ' },
    THB: { zh: '฿',     en: 'THB ',vi: 'THB ' },
    SAR: { zh: 'SAR ',  en: 'SAR ',vi: 'SAR ' },
    AED: { zh: 'AED ',  en: 'AED ',vi: 'AED ' },
  };
  const s = symbolMap[currency][locale];
  const n = new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'vi' ? 'vi-VN' : 'en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
  return `${s}${n}`;
}

export function formatDate(d: string | Date, locale: Locale = 'zh'): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (locale === 'en') return `${m}/${day}/${y}`;
  if (locale === 'vi') return `${day}/${m}/${y}`;
  return `${y}-${m}-${day}`;
}

export const localeLabel: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  vi: 'Tiếng Việt',
};
