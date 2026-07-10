export type Locale = 'zh' | 'en' | 'vi';
export type Currency = 'USD' | 'CNY' | 'VND' | 'MYR' | 'THB' | 'SAR' | 'AED';

export type QuotationStatus =
  | '草稿' | '已发送' | '谈判中' | '赢单' | '输单' | '过期' | '已改版';

export const QUOTATION_STATUSES: QuotationStatus[] = [
  '草稿', '已发送', '谈判中', '赢单', '输单', '过期', '已改版',
];

export type Incoterm = 'FOB' | 'CIF' | 'CFR' | 'EXW';
export type LogisticsType = '海运' | '空运' | '陆运';

export type TermsType = 'payment' | 'delivery' | 'quality' | 'warranty' | 'general';

export interface CompanyProfile {
  id: string;
  name_zh: string;
  name_en: string;
  address_zh: string | null;
  address_en: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  seal_url: string | null;
  bank_info: BankInfo | null;
  default_locale: Locale;
}

export interface BankAccount {
  beneficiary: string;
  bank_name: string;
  account_no: string;
  swift?: string;
  address?: string;
}

export interface BankInfo {
  usd?: BankAccount;
  cny?: BankAccount;
}

export interface Product {
  id: string;
  category: string;
  name_zh: string;
  name_en: string;
  name_vi: string | null;
  sku: string;
  spec: string | null;
  unit: string;
  cost_price: number;
  pcs_per_carton: number;
  carton_gross_weight: number;
  carton_net_weight: number;
  carton_cbm: number;
  hs_code: string | null;
  shelf_life: string | null;
  storage_condition: string | null;
  ingredients_en: string | null;
  is_halal: boolean;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductTierPrice {
  id: string;
  product_id: string;
  tier_name: string;
  min_qty: number;
  max_qty: number | null;
  price_usd: number | null;
  margin_rate: number | null;
}

export interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string;
  city: string | null;
  address: string | null;
  currency: Currency;
  language: Locale;
  payment_terms: string;
  incoterms: Incoterm;
  customer_level: string;
  default_discount: number;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id?: string;
  product_id: string | null;
  line_no: number;
  product_name_output: string;
  sku: string;
  spec: string;
  unit: string;
  quantity: number;
  cartons?: number;
  cost_price?: number;
  margin_rate?: number;
  unit_price: number;
  total_price?: number;
  gross_weight?: number;
  cbm?: number;
  notes?: string;
}

export interface Quotation {
  id?: string;
  quote_no: string;
  pi_no?: string | null;
  customer_id: string | null;
  status: QuotationStatus;
  currency: Currency;
  language: Locale;
  incoterms: Incoterm;
  port_of_loading: string;
  port_of_destination: string;
  payment_terms: string;
  lead_time: string;
  valid_days: number;
  valid_until: string;
  exchange_rate: number;
  exchange_rate_locked: boolean;
  logistics_cost: number;
  logistics_type: LogisticsType;
  tax_rate: number;
  insurance_rate: number;
  other_charges: number;
  notes: string;
  internal_notes: string;
  lost_reason: string | null;
  version: number;
  parent_quote_id: string | null;
  created_by: string;
  sent_at: string | null;
  items: QuotationItem[];
  selected_term_ids: string[];
}

export interface TermsTemplate {
  id: string;
  name: string;
  type: TermsType;
  content_zh: string | null;
  content_en: string | null;
  content_vi: string | null;
  is_default: boolean;
}

export interface QuotationFollowup {
  id: string;
  quotation_id: string;
  followup_date: string;
  content: string;
  next_followup_date: string | null;
  created_by: string;
  created_at: string;
}

export interface RateConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
}

export interface ProductCategory {
  id: string;
  name_zh: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
}

// ====== 计算引擎输出 ======
export interface PriceCalcInput {
  costPrice: number;
  marginRate: number;
  taxRate: number;
  customerDiscount: number;
  manualUnitPrice?: number | null;
}

export interface PriceCalcResult {
  unitPrice: number;
  unitPriceBeforeDiscount: number;
  totalPrice: number;
  taxInclusivePrice: number;
  grossProfit: number;
  grossMargin: number;
  effectiveMarginRate: number;
}

export interface LogisticsCalc {
  totalCartons: number;
  totalGrossWeight: number;
  totalCbm: number;
  insurance: number;
  freightPerCarton: number;
  subtotal: number;
  total: number;
  totalProfit: number;
  totalMargin: number;
}
