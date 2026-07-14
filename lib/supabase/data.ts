/**
 * 数据访问层：抽象 Supabase + 内置 mock
 * - 当 NEXT_PUBLIC_SUPABASE_URL 未配置时使用 mock 数据
 * - 生产环境通过 supabase 客户端访问真实数据库
 */

import { getBrowserSupabase, isSupabaseConfigured } from './client';
import type {
  Product, ProductTierPrice, Customer, Quotation, QuotationItem,
  TermsTemplate, QuotationFollowup, CompanyProfile, RateConfig, ProductCategory,
} from '@/types';

// ============ Mock 数据 ============
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1', category: '冻干零食', name_zh: '冻干鸡胸肉 50g/袋', name_en: 'Freeze-Dried Chicken Breast 50g',
    name_vi: 'Ức gà sấy thăng hoa 50g', sku: 'YW-FD-CHK-050', spec: '50g/袋 * 80 袋/箱', unit: '袋',
    cost_price: 0.45, pcs_per_carton: 80, carton_gross_weight: 6.4, carton_net_weight: 4.0, carton_cbm: 0.020,
    hs_code: '2309.10', shelf_life: '24 months', storage_condition: '常温阴凉干燥处',
    ingredients_en: '100% Chicken Breast', is_halal: false, is_active: true, image_url: null,
    created_at: '2024-11-01', updated_at: '2024-11-01',
  },
  {
    id: 'p2', category: '猫条', name_zh: '猫条 金枪鱼味 15g*7 支', name_en: 'Cat Pouch Tuna 15g*7',
    name_vi: 'Pate cá ngừ 15g*7', sku: 'YW-CP-TUN-015', spec: '15g*7 支/盒 * 24 盒/箱', unit: '盒',
    cost_price: 0.85, pcs_per_carton: 24, carton_gross_weight: 6.0, carton_net_weight: 4.32, carton_cbm: 0.025,
    hs_code: '2309.90', shelf_life: '24 months', storage_condition: '常温',
    ingredients_en: 'Tuna, Water, Tapioca Starch, Taurine, Vitamin E', is_halal: false, is_active: true, image_url: null,
    created_at: '2024-11-01', updated_at: '2024-11-01',
  },
  {
    id: 'p3', category: '罐头', name_zh: '鸡肉蔬菜罐头 170g', name_en: 'Chicken & Vegetable Can 170g',
    name_vi: 'Lon gà rau củ 170g', sku: 'YW-CN-CHK-170', spec: '170g/罐 * 24 罐/箱', unit: '罐',
    cost_price: 0.65, pcs_per_carton: 24, carton_gross_weight: 5.5, carton_net_weight: 4.08, carton_cbm: 0.018,
    hs_code: '2309.10', shelf_life: '36 months', storage_condition: '常温',
    ingredients_en: 'Chicken, Carrot, Pea, Rice, Vitamin Mix', is_halal: true, is_active: true, image_url: null,
    created_at: '2024-11-01', updated_at: '2024-11-01',
  },
  {
    id: 'p4', category: '猫主粮', name_zh: '无谷三文鱼猫粮 1.5kg', name_en: 'Grain-Free Salmon Cat Food 1.5kg',
    name_vi: 'Thức ăn mèo cá hồi không ngũ cốc 1.5kg', sku: 'YW-DCF-SAL-1.5', spec: '1.5kg/袋 * 8 袋/箱', unit: '袋',
    cost_price: 2.10, pcs_per_carton: 8, carton_gross_weight: 12.8, carton_net_weight: 12.0, carton_cbm: 0.045,
    hs_code: '2309.10', shelf_life: '18 months', storage_condition: '常温',
    ingredients_en: 'Salmon, Sweet Potato, Pea Protein, Fish Oil', is_halal: false, is_active: true, image_url: null,
    created_at: '2024-11-01', updated_at: '2024-11-01',
  },
];

const MOCK_TIERS: ProductTierPrice[] = [
  { id: 't1', product_id: 'p1', tier_name: '散货',  min_qty: 100,  max_qty: 999,  price_usd: null, margin_rate: 0.40 },
  { id: 't2', product_id: 'p1', tier_name: '整箱',  min_qty: 1000, max_qty: 4999, price_usd: null, margin_rate: 0.35 },
  { id: 't3', product_id: 'p1', tier_name: 'VIP',   min_qty: 5000, max_qty: null, price_usd: null, margin_rate: 0.28 },
  { id: 't4', product_id: 'p2', tier_name: '散货',  min_qty: 50,   max_qty: 499,  price_usd: null, margin_rate: 0.38 },
  { id: 't5', product_id: 'p2', tier_name: '整箱',  min_qty: 500,  max_qty: null, price_usd: null, margin_rate: 0.32 },
  { id: 't6', product_id: 'p3', tier_name: '散货',  min_qty: 100,  max_qty: 999,  price_usd: null, margin_rate: 0.40 },
  { id: 't7', product_id: 'p3', tier_name: '整柜',  min_qty: 1000, max_qty: null, price_usd: null, margin_rate: 0.30 },
  { id: 't8', product_id: 'p4', tier_name: '整箱',  min_qty: 50,   max_qty: null, price_usd: null, margin_rate: 0.35 },
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1', customer_code: 'VN-001', company_name: 'CÔNG TY TNHH THÚ CƯNG VIỆT PET',
    contact_person: 'Nguyễn Văn A', email: 'buyer@vietpet.vn', phone: '+84-28-9999-0001',
    whatsapp: '+84-909-888-777', country: 'VN', city: 'Ho Chi Minh City',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM', currency: 'USD', language: 'vi',
    payment_terms: 'T/T 30% đặt cọc, 70% còn lại khi nhận bản sao B/L',
    incoterms: 'FOB', customer_level: 'VIP代理', default_discount: 0.05,
    tax_id: '0316-888-999', notes: '越南最大宠物食品分销商之一', is_active: true,
    created_at: '2024-09-15', updated_at: '2024-11-10',
  },
  {
    id: 'c2', customer_code: 'MY-001', company_name: 'PawPal Trading Sdn Bhd',
    contact_person: 'Lim Mei Ling', email: 'meiling@pawpal.my', phone: '+60-3-2026-1234',
    whatsapp: '+60-12-345-6789', country: 'MY', city: 'Kuala Lumpur',
    address: 'Lot 88, Jalan Sultan, 50000 KL', currency: 'USD', language: 'en',
    payment_terms: 'T/T 30% deposit, 70% before shipment',
    incoterms: 'CIF', customer_level: '普通客户', default_discount: 0,
    tax_id: null, notes: '马来西亚连锁宠物店供应商', is_active: true,
    created_at: '2024-08-20', updated_at: '2024-10-25',
  },
  {
    id: 'c3', customer_code: 'SA-001', company_name: 'Al Noor Pet Supplies LLC',
    contact_person: 'Ahmed Al-Saud', email: 'ahmed@alnoor.sa', phone: '+966-11-456-7890',
    whatsapp: '+966-50-123-4567', country: 'SA', city: 'Riyadh',
    address: 'King Fahd Road, Riyadh 12244', currency: 'USD', language: 'en',
    payment_terms: 'L/C at sight',
    incoterms: 'CIF', customer_level: '战略合作', default_discount: 0.08,
    tax_id: '3001-2345-6789', notes: '需要 Halal 认证', is_active: true,
    created_at: '2024-07-01', updated_at: '2024-11-05',
  },
  {
    id: 'c4', customer_code: 'TH-001', company_name: 'Bangkok Pet Mart Co., Ltd.',
    contact_person: 'Suda Thanee', email: 'suda@bkpet.co.th', phone: '+66-2-555-0001',
    whatsapp: '+66-81-234-5678', country: 'TH', city: 'Bangkok',
    address: '99 Sukhumvit Road, Bangkok 10110', currency: 'USD', language: 'en',
    payment_terms: 'T/T 30% deposit, 70% before shipment',
    incoterms: 'FOB', customer_level: '老客户', default_discount: 0.03,
    tax_id: '0105-555-666-7777', notes: '月度稳定订单', is_active: true,
    created_at: '2024-06-12', updated_at: '2024-11-01',
  },
];

const MOCK_TERMS: TermsTemplate[] = [
  { id: 'tm1', name: '30/70 定金', type: 'payment', is_default: true,
    content_zh: 'T/T 30% 定金，70% 见提单副本后付清',
    content_en: 'T/T 30% deposit, 70% balance against copy of B/L',
    content_vi: 'T/T 30% đặt cọc, 70% còn lại khi nhận bản sao B/L' },
  { id: 'tm2', name: '即期信用证', type: 'payment', is_default: false,
    content_zh: '不可撤销即期信用证',
    content_en: 'Irrevocable L/C at sight',
    content_vi: 'Thư tín dụng không thể hủy ngang trả ngay' },
  { id: 'tm3', name: '25-30 工作日交货', type: 'delivery', is_default: true,
    content_zh: '收到定金后 25-30 个工作日内交货',
    content_en: '25-30 working days after deposit received',
    content_vi: '25-30 ngày làm việc sau khi nhận đặt cọc' },
  { id: 'tm4', name: '质量保证', type: 'quality', is_default: true,
    content_zh: '保质期内如出现质量问题，我司负责免费补发或退款',
    content_en: 'Any quality issue within shelf life, we will resend or refund',
    content_vi: 'Nếu có vấn đề chất lượng trong thời hạn sử dụng, chúng tôi sẽ gửi bù hoặc hoàn tiền' },
];

const MOCK_RATES: Record<string, string> = {
  default_margin_rate: '0.35', default_tax_rate: '0', default_insurance_rate: '0.003',
  default_valid_days: '30', default_lead_time: '25-30 working days after deposit received',
  exchange_usd_cny: '7.25', exchange_usd_vnd: '25000', exchange_usd_myr: '4.70',
  exchange_usd_thb: '35.50', exchange_usd_sar: '3.75', exchange_usd_aed: '3.673',
};

const MOCK_COMPANY: CompanyProfile = {
  id: 'co1', name_zh: '邢台云伟进出口有限公司', name_en: 'Xingtai Yunwei Import and Export Co., Ltd.',
  address_zh: '河北省邢台市桥西区中兴西大街 188 号',
  address_en: 'No.188 Zhongxing West Street, Qiaoxi District, Xingtai City, Hebei, China',
  phone: '+86-319-8888-6666', email: 'sales@xtyunwei.com', website: 'https://www.xtyunwei.com',
  logo_url: null, seal_url: null, default_locale: 'zh',
  bank_info: {
    usd: { beneficiary: 'Xingtai Yunwei Import and Export Co., Ltd.',
      bank_name: 'Bank of China, Hebei Branch', account_no: 'USD-1008-8888-9999-0001',
      swift: 'BKCHCNBJ45A', address: 'Shijiazhuang, Hebei, China' },
    cny: { beneficiary: '邢台云伟进出口有限公司', bank_name: '中国银行河北省分行',
      account_no: 'CNY-1008-6666-5555-0001', address: '石家庄市中山西路22号' },
  },
};

// ============ 抽象 API（同时支持 Supabase 与 Mock） ============
export const data = {
  isMock: () => !isSupabaseConfigured(),

  // --- 公司 ---
  company: {
    async get(): Promise<CompanyProfile> {
      if (!isSupabaseConfigured()) return MOCK_COMPANY;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('company_profile').select('*').limit(1).single();
      return data ?? MOCK_COMPANY;
    },
  },

  // --- 产品 ---
  products: {
    async list(): Promise<Product[]> {
      if (!isSupabaseConfigured()) return MOCK_PRODUCTS;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
      return (data ?? []) as Product[];
    },
    async tiers(productId?: string): Promise<ProductTierPrice[]> {
      if (!isSupabaseConfigured()) {
        return productId ? MOCK_TIERS.filter((t) => t.product_id === productId) : MOCK_TIERS;
      }
      const sb = getBrowserSupabase();
      let q = sb.from('product_tier_prices').select('*');
      if (productId) q = q.eq('product_id', productId);
      const { data } = await q;
      return (data ?? []) as ProductTierPrice[];
    },
    async upsert(p: Partial<Product> & { id?: string }): Promise<Product> {
      if (!isSupabaseConfigured()) {
        const idx = MOCK_PRODUCTS.findIndex((x) => x.id === p.id);
        const next = { ...MOCK_PRODUCTS[idx >= 0 ? idx : 0], ...p, updated_at: new Date().toISOString() } as Product;
        if (idx >= 0) MOCK_PRODUCTS[idx] = next; else MOCK_PRODUCTS.unshift(next);
        return next;
      }
      const sb = getBrowserSupabase();
      const { data } = await sb.from('products').upsert(p).select().single();
      return data as Product;
    },
    async remove(id: string): Promise<void> {
      if (!isSupabaseConfigured()) {
        const idx = MOCK_PRODUCTS.findIndex((x) => x.id === id);
        if (idx >= 0) MOCK_PRODUCTS.splice(idx, 1);
        return;
      }
      const sb = getBrowserSupabase();
      await sb.from('products').update({ is_active: false }).eq('id', id);
    },
  },

  // --- 客户 ---
  customers: {
    async list(): Promise<Customer[]> {
      if (!isSupabaseConfigured()) return MOCK_CUSTOMERS;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('customers').select('*').order('created_at', { ascending: false });
      return (data ?? []) as Customer[];
    },
    async upsert(c: Partial<Customer> & { id?: string }): Promise<Customer> {
      if (!isSupabaseConfigured()) {
        const idx = MOCK_CUSTOMERS.findIndex((x) => x.id === c.id);
        const next = { ...MOCK_CUSTOMERS[idx >= 0 ? idx : 0], ...c, updated_at: new Date().toISOString() } as Customer;
        if (idx >= 0) MOCK_CUSTOMERS[idx] = next; else MOCK_CUSTOMERS.unshift(next);
        return next;
      }
      const sb = getBrowserSupabase();
      const { data } = await sb.from('customers').upsert(c).select().single();
      return data as Customer;
    },
  },

  // --- 条款模板 ---
  terms: {
    async list(): Promise<TermsTemplate[]> {
      if (!isSupabaseConfigured()) return MOCK_TERMS;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('terms_templates').select('*').order('is_default', { ascending: false });
      return (data ?? []) as TermsTemplate[];
    },
  },

  // --- 报价单 ---
  quotations: {
    async list(): Promise<Quotation[]> {
      if (!isSupabaseConfigured()) return []; // Mock 暂不持久化
      const sb = getBrowserSupabase();
      const { data } = await sb.from('quotations')
        .select('*, items:quotation_items(*), customer:customers(*)')
        .order('created_at', { ascending: false });
      return (data ?? []) as Quotation[];
    },
    async get(id: string): Promise<Quotation | null> {
      if (!isSupabaseConfigured()) return null;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('quotations')
        .select('*, items:quotation_items(*), customer:customers(*)')
        .eq('id', id).single();
      return data as Quotation;
    },
    async getByNo(quoteNo: string): Promise<Quotation | null> {
      if (!isSupabaseConfigured()) return null;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('quotations')
        .select('*, items:quotation_items(*), customer:customers(*)')
        .eq('quote_no', quoteNo).single();
      return data as Quotation;
    },
    async save(q: Quotation): Promise<Quotation> {
      if (!isSupabaseConfigured()) return q; // 演示环境：仅返回
      const sb = getBrowserSupabase();
      // 剔除瞬态字段：
      // - id: 由 DB 生成
      // - items: 单独存 quotation_items 表
      // selected_term_ids 是真实持久化列（迁移 0002_add_selected_term_ids.sql），正常保留；
      // 若用户尚未执行该迁移（列不存在），insert/update 会报 42703，此时降级剔除该字段重试，
      // 保证保存链路不中断（只是暂未持久化勾选，PDF 回退渲染全部条款）。
      const { id: _ignored, items, ...header } = q as Quotation & { selected_term_ids?: string[] };
      if ((header as { selected_term_ids?: string[] }).selected_term_ids === undefined) {
        (header as { selected_term_ids?: string[] }).selected_term_ids = [];
      }

      // 用 quote_no 查现有 id，避免重复 insert
      const { data: existing } = await sb.from('quotations')
        .select('id').eq('quote_no', q.quote_no).maybeSingle();

      const upsert = async (h: Record<string, unknown>) => {
        if (existing?.id) {
          return sb.from('quotations').update(h).eq('id', existing.id).select().single();
        }
        return sb.from('quotations').insert(h).select().single();
      };

      let res = await upsert(header as Record<string, unknown>);
      // 容错：列不存在时降级（剔除 selected_term_ids 后重试一次）
      if (res.error && /column "selected_term_ids" does not exist/i.test(res.error.message)) {
        const { selected_term_ids, ...fallback } = header as Record<string, unknown> & { selected_term_ids?: unknown };
        res = await upsert(fallback);
      }
      if (res.error) throw res.error;
      const savedId = (res.data as { id: string }).id;

      // 同步明细：删旧 → 插新
      if (items?.length) {
        await sb.from('quotation_items').delete().eq('quotation_id', savedId);
        const itemRows = items.map((i: any) => {
          const { id: _iid, grossProfit: _gp, grossMargin: _gm, ...row } = i;
          // 仅保留数据库实际存在的列，防止额外字段导致 insert 失败
          const clean = {
            product_id: row.product_id ?? null,
            line_no: row.line_no ?? 0,
            product_name_output: row.product_name_output ?? '',
            sku: row.sku ?? '',
            spec: row.spec ?? '',
            unit: row.unit ?? '',
            quantity: row.quantity ?? 0,
            cartons: row.cartons ?? 0,
            cost_price: row.cost_price ?? 0,
            margin_rate: row.margin_rate ?? 0,
            unit_price: row.unit_price ?? 0,
            total_price: row.total_price ?? 0,
            gross_weight: row.gross_weight ?? 0,
            cbm: row.cbm ?? 0,
            notes: row.notes ?? '',
            quotation_id: savedId,
          };
          return clean;
        });
        const { error: itemsError } = await sb.from('quotation_items').insert(itemRows);
        if (itemsError) throw itemsError;
      }
      return { ...q, id: savedId };
    },
  },

  // --- 费率 ---
  rates: {
    async getAll(): Promise<Record<string, string>> {
      if (!isSupabaseConfigured()) return MOCK_RATES;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('rate_configs').select('*');
      const out: Record<string, string> = {};
      for (const r of (data ?? []) as RateConfig[]) out[r.config_key] = r.config_value;
      return out;
    },
  },

  // --- 产品大类 ---
  categories: {
    async list(): Promise<ProductCategory[]> {
      if (!isSupabaseConfigured()) return [
        { id: 'c1', name_zh: '冻干零食', name_en: 'Freeze-Dried Treats', sort_order: 1, is_active: true },
        { id: 'c2', name_zh: '猫条/湿粮', name_en: 'Cat Pouches / Wet Food', sort_order: 2, is_active: true },
        { id: 'c3', name_zh: '猫主粮', name_en: 'Cat Dry Food', sort_order: 3, is_active: true },
        { id: 'c4', name_zh: '狗主粮', name_en: 'Dog Dry Food', sort_order: 4, is_active: true },
        { id: 'c5', name_zh: '罐头', name_en: 'Canned Food', sort_order: 5, is_active: true },
        { id: 'c6', name_zh: '咬胶', name_en: 'Dog Chews', sort_order: 6, is_active: true },
      ];
      const sb = getBrowserSupabase();
      const { data } = await sb.from('product_categories').select('*').order('sort_order');
      return (data ?? []) as ProductCategory[];
    },
  },
};
