-- =====================================================================
-- 云威宠物食品报价系统  |  Yunwei Petfood Quotation System
-- Supabase PostgreSQL Schema & RLS
-- =====================================================================

-- 启用所需扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 业务时区（统一 Asia/Shanghai）
ALTER DATABASE postgres SET timezone TO 'Asia/Shanghai';

-- =====================================================================
-- 1. 公司信息
-- =====================================================================
CREATE TABLE IF NOT EXISTS company_profile (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  address_zh      TEXT,
  address_en      TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  logo_url        TEXT,
  seal_url        TEXT,
  bank_info       JSONB,            -- 多账户: { usd: {bank, acct, swift...}, cny: {...} }
  default_locale  TEXT DEFAULT 'zh',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 2. 产品库
-- =====================================================================
CREATE TABLE IF NOT EXISTS products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category           TEXT NOT NULL,        -- 冻干/猫条/猫主粮/狗主粮/罐头/咬胶
  name_zh            TEXT NOT NULL,
  name_en            TEXT NOT NULL,
  name_vi            TEXT,
  sku                TEXT UNIQUE NOT NULL,
  spec               TEXT,
  unit               TEXT DEFAULT '袋',
  cost_price         DECIMAL(10,4) NOT NULL DEFAULT 0,  -- USD
  pcs_per_carton     INTEGER DEFAULT 1,
  carton_gross_weight DECIMAL(8,3) DEFAULT 0,  -- kg
  carton_net_weight  DECIMAL(8,3) DEFAULT 0,
  carton_cbm         DECIMAL(8,6) DEFAULT 0,
  hs_code            TEXT,
  shelf_life         TEXT,
  storage_condition  TEXT,
  ingredients_en     TEXT,
  is_halal           BOOLEAN DEFAULT FALSE,
  is_active          BOOLEAN DEFAULT TRUE,
  image_url          TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- =====================================================================
-- 3. 阶梯价格
-- =====================================================================
CREATE TABLE IF NOT EXISTS product_tier_prices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  tier_name   TEXT NOT NULL,
  min_qty     INTEGER NOT NULL,
  max_qty     INTEGER,                 -- NULL=无上限
  price_usd   DECIMAL(10,4),           -- 直接价，与 margin_rate 二选一
  margin_rate DECIMAL(5,4),            -- 0.35 = 35%
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tier_product ON product_tier_prices(product_id);

-- =====================================================================
-- 4. 客户库
-- =====================================================================
CREATE TABLE IF NOT EXISTS customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code       TEXT UNIQUE NOT NULL,
  company_name        TEXT NOT NULL,
  contact_person      TEXT,
  email               TEXT,
  phone               TEXT,
  whatsapp            TEXT,
  country             TEXT NOT NULL,
  city                TEXT,
  address             TEXT,
  currency            TEXT DEFAULT 'USD',
  language            TEXT DEFAULT 'en',
  payment_terms       TEXT DEFAULT 'T/T 30% deposit, 70% before shipment',
  incoterms           TEXT DEFAULT 'FOB',
  customer_level      TEXT DEFAULT '普通客户',
  default_discount    DECIMAL(5,4) DEFAULT 0,
  tax_id              TEXT,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers(country);
CREATE INDEX IF NOT EXISTS idx_customers_level ON customers(customer_level);

-- =====================================================================
-- 5. 报价单主表
-- =====================================================================
CREATE TABLE IF NOT EXISTS quotations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_no              TEXT UNIQUE NOT NULL,
  pi_no                 TEXT UNIQUE,
  customer_id           UUID REFERENCES customers(id),
  status                TEXT DEFAULT '草稿',
  currency              TEXT DEFAULT 'USD',
  language              TEXT DEFAULT 'en',
  incoterms             TEXT,
  port_of_loading       TEXT DEFAULT 'Qingdao, China',
  port_of_destination   TEXT,
  payment_terms         TEXT,
  lead_time             TEXT,
  valid_days            INTEGER DEFAULT 30,
  valid_until           DATE,
  exchange_rate         DECIMAL(12,4) DEFAULT 1.0,
  exchange_rate_locked  BOOLEAN DEFAULT FALSE,
  logistics_cost        DECIMAL(12,2) DEFAULT 0,
  logistics_type        TEXT,
  tax_rate              DECIMAL(5,4) DEFAULT 0,
  insurance_rate        DECIMAL(5,4) DEFAULT 0.003,
  other_charges         DECIMAL(12,2) DEFAULT 0,
  notes                 TEXT,
  internal_notes        TEXT,
  lost_reason           TEXT,
  version               INTEGER DEFAULT 1,
  parent_quote_id       UUID REFERENCES quotations(id),
  created_by            TEXT,
  sent_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);

-- =====================================================================
-- 6. 报价单明细
-- =====================================================================
CREATE TABLE IF NOT EXISTS quotation_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id         UUID REFERENCES quotations(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES products(id),
  line_no              INTEGER NOT NULL,
  product_name_output  TEXT,
  sku                  TEXT,
  spec                 TEXT,
  unit                 TEXT,
  quantity             INTEGER NOT NULL DEFAULT 0,
  cartons              INTEGER,
  cost_price           DECIMAL(10,4),
  margin_rate          DECIMAL(5,4),
  unit_price           DECIMAL(10,4) NOT NULL DEFAULT 0,
  total_price          DECIMAL(14,4),
  gross_weight         DECIMAL(12,3),
  cbm                  DECIMAL(12,6),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qitems_quotation ON quotation_items(quotation_id);

-- =====================================================================
-- 7. 条款模板
-- =====================================================================
CREATE TABLE IF NOT EXISTS terms_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,        -- payment/delivery/quality/warranty/general
  content_zh   TEXT,
  content_en   TEXT,
  content_vi   TEXT,
  is_default   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 8. 费率/汇率配置
-- =====================================================================
CREATE TABLE IF NOT EXISTS rate_configs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key   TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description  TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 9. 跟进记录
-- =====================================================================
CREATE TABLE IF NOT EXISTS quotation_followups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id        UUID REFERENCES quotations(id) ON DELETE CASCADE,
  followup_date       TIMESTAMPTZ DEFAULT NOW(),
  content             TEXT NOT NULL,
  next_followup_date  DATE,
  created_by          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 10. 产品大类（动态可配）
-- =====================================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 11. 用户-角色（轻量权限）
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'sales',  -- admin / manager / sales
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 触发器：自动更新 updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_company  BEFORE UPDATE ON company_profile     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON customers          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  CREATE TRIGGER set_updated_at_quotations BEFORE UPDATE ON quotations        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  CREATE TRIGGER set_updated_at_rates     BEFORE UPDATE ON rate_configs       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 报价单号自动生成（YW-QT-YYYYMMDD-XXX）
-- =====================================================================
CREATE OR REPLACE FUNCTION generate_quote_no(p_prefix TEXT DEFAULT 'QT')
RETURNS TEXT AS $$
DECLARE
  v_date TEXT := TO_CHAR(NOW() AT TIME ZONE 'Asia/Shanghai', 'YYYYMMDD');
  v_seq  INTEGER;
  v_no   TEXT;
BEGIN
  SELECT COUNT(*)+1 INTO v_seq
  FROM quotations
  WHERE quote_no LIKE 'YW-' || p_prefix || '-' || v_date || '%';
  v_no := 'YW-' || p_prefix || '-' || v_date || '-' || LPAD(v_seq::TEXT, 3, '0');
  RETURN v_no;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 客户编码生成（VN-001 / MY-001 ...）
-- =====================================================================
CREATE OR REPLACE FUNCTION generate_customer_code(p_country TEXT)
RETURNS TEXT AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  SELECT COUNT(*)+1 INTO v_seq FROM customers WHERE customer_code LIKE p_country || '-%';
  RETURN p_country || '-' || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- RLS 策略
-- =====================================================================
ALTER TABLE company_profile      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tier_prices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_configs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_followups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles           ENABLE ROW LEVEL SECURITY;

-- 读：所有认证用户
CREATE POLICY "auth read"  ON products           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON product_tier_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON customers          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON company_profile    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON terms_templates    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON rate_configs       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON quotation_items    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON quotation_followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read"  ON quotations         FOR SELECT TO authenticated USING (true);

-- 写：登录用户可写产品/客户/模板/费率（实际权限在应用层细分）
CREATE POLICY "auth write" ON products           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON product_tier_prices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON customers          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON terms_templates    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON rate_configs       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON quotation_items    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth write" ON quotation_followups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 报价单：业务员只能改自己创建的；manager/admin 看全部
CREATE POLICY "owner write quotation" ON quotations
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','manager'))
  )
  WITH CHECK (true);
