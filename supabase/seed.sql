-- =====================================================================
-- Seed Data for Yunwei Petfood Quotation System
-- =====================================================================

-- 1) 公司信息
INSERT INTO company_profile (id, name_zh, name_en, address_zh, address_en, phone, email, website, default_locale, bank_info) VALUES
('11111111-1111-1111-1111-111111111111',
 '邢台云威进出口有限公司',
 'Xingtai Yunwei Import and Export Co., Ltd.',
 '河北省邢台市桥西区中兴西大街 188 号',
 'No.188 Zhongxing West Street, Qiaoxi District, Xingtai City, Hebei, China',
 '+86-319-8888-6666',
 'sales@xtyunwei.com',
 'https://www.xtyunwei.com',
 'zh',
 '{
    "usd": {
      "beneficiary": "Xingtai Yunwei Import and Export Co., Ltd.",
      "bank_name": "Bank of China, Hebei Branch",
      "account_no": "USD-1008-8888-9999-0001",
      "swift": "BKCHCNBJ45A",
      "address": "No.22 Zhongshan West Road, Shijiazhuang, Hebei, China"
    },
    "cny": {
      "beneficiary": "邢台云威进出口有限公司",
      "bank_name": "中国银行河北省分行",
      "account_no": "CNY-1008-6666-5555-0001",
      "address": "石家庄市中山西路22号"
    }
  }'::jsonb
);

-- 2) 费率/汇率
INSERT INTO rate_configs (config_key, config_value, description) VALUES
  ('default_margin_rate',  '0.35',   '默认利润率 35%'),
  ('default_tax_rate',     '0.00',   '默认出口退税率 0%（按需调整）'),
  ('default_insurance_rate','0.003', '默认保险费率 0.3%'),
  ('default_valid_days',   '30',     '默认报价有效天数'),
  ('default_lead_time',    '25-30 working days after deposit received', '默认交货期'),
  ('exchange_usd_cny',     '7.25',   'USD → CNY'),
  ('exchange_usd_vnd',     '25000',  'USD → VND'),
  ('exchange_usd_myr',     '4.70',   'USD → MYR'),
  ('exchange_usd_thb',     '35.50',  'USD → THB'),
  ('exchange_usd_sar',     '3.75',   'USD → SAR'),
  ('exchange_usd_aed',     '3.673',  'USD → AED'),
  ('usd_to_cny',           '7.25',   '兼容旧字段');

-- 3) 产品大类
INSERT INTO product_categories (name_zh, name_en, sort_order) VALUES
  ('冻干零食', 'Freeze-Dried Treats', 1),
  ('猫条/湿粮', 'Cat Pouches / Wet Food', 2),
  ('猫主粮',   'Cat Dry Food', 3),
  ('狗主粮',   'Dog Dry Food', 4),
  ('罐头',     'Canned Food', 5),
  ('咬胶',     'Dog Chews', 6);

-- 4) 示例产品（3 个）
INSERT INTO products (id, category, name_zh, name_en, name_vi, sku, spec, unit, cost_price, pcs_per_carton, carton_gross_weight, carton_net_weight, carton_cbm, hs_code, shelf_life, storage_condition, ingredients_en, is_halal) VALUES
('aaaa1111-0000-0000-0000-000000000001',
 '冻干零食','冻干鸡胸肉 50g/袋',
 'Freeze-Dried Chicken Breast 50g/bag',
 'Ức gà sấy thăng hoa 50g',
 'YW-FD-CHK-050', '50g/袋 * 80 袋/箱', '袋',
 0.45, 80, 6.400, 4.000, 0.020, '2309.10',
 '24 months','常温阴凉干燥处',
 '100% Chicken Breast', false),

('aaaa1111-0000-0000-0000-000000000002',
 '猫条','猫条 金枪鱼味 15g*7 支',
 'Cat Pouch Tuna Flavor 15g*7 sticks',
 'Pate cá ngừ cho mèo 15g*7 thanh',
 'YW-CP-TUN-015', '15g*7 支/盒 * 24 盒/箱', '盒',
 0.85, 24, 6.000, 4.320, 0.025, '2309.90',
 '24 months','常温',
 'Tuna, Water, Tapioca Starch, Taurine, Vitamin E', false),

('aaaa1111-0000-0000-0000-000000000003',
 '罐头','鸡肉蔬菜罐头 170g',
 'Chicken & Vegetable Can 170g',
 'Lon gà rau củ 170g',
 'YW-CN-CHK-170', '170g/罐 * 24 罐/箱', '罐',
 0.65, 24, 5.500, 4.080, 0.018, '2309.10',
 '36 months','常温',
 'Chicken, Carrot, Pea, Rice, Vitamin Mix', true);

-- 5) 阶梯价格
INSERT INTO product_tier_prices (product_id, tier_name, min_qty, max_qty, margin_rate) VALUES
('aaaa1111-0000-0000-0000-000000000001', '散货',  100,  999,    0.40),
('aaaa1111-0000-0000-0000-000000000001', '整箱',  1000, 4999,   0.35),
('aaaa1111-0000-0000-0000-000000000001', 'VIP',   5000, NULL,   0.28),
('aaaa1111-0000-0000-0000-000000000002', '散货',  50,   499,    0.38),
('aaaa1111-0000-0000-0000-000000000002', '整箱',  500,  NULL,   0.32),
('aaaa1111-0000-0000-0000-000000000003', '散货',  100,  999,    0.40),
('aaaa1111-0000-0000-0000-000000000003', '整柜',  1000, NULL,   0.30);

-- 6) 条款模板
INSERT INTO terms_templates (name, type, content_zh, content_en, content_vi, is_default) VALUES
('30/70 定金', 'payment',
 'T/T 30% 定金，70% 见提单副本后付清',
 'T/T 30% deposit, 70% balance against copy of B/L',
 'T/T 30% đặt cọc, 70% còn lại khi nhận bản sao B/L', true),

('即期信用证', 'payment',
 '不可撤销即期信用证',
 'Irrevocable L/C at sight',
 'Thư tín dụng không thể hủy ngang trả ngay', false),

('25-30 工作日', 'delivery',
 '收到定金后 25-30 个工作日',
 '25-30 working days after deposit received',
 '25-30 ngày làm việc sau khi nhận đặt cọc', true),

('质量保证', 'quality',
 '保质期内如有质量问题，请提供照片与视频，我司免费补发或退款',
 'Any quality issue within shelf life, please provide photos & video, we will resend or refund',
 'Nếu có vấn đề chất lượng trong thời hạn sử dụng, vui lòng cung cấp ảnh & video, chúng tôi sẽ gửi bù hoặc hoàn tiền', true);

-- 7) 示例客户
INSERT INTO customers (customer_code, company_name, contact_person, email, whatsapp, country, city, currency, language, customer_level, default_discount) VALUES
('VN-001','CÔNG TY TNHH THÚ CƯNG VIỆT PET','Nguyễn Văn A','buyer@vietpet.vn','+84-909-888-777','VN','Ho Chi Minh City','USD','vi','VIP代理',0.05),
('MY-001','PawPal Trading Sdn Bhd','Lim Mei Ling','meiling@pawpal.my','+60-12-345-6789','MY','Kuala Lumpur','USD','en','普通客户',0),
('SA-001','Al Noor Pet Supplies LLC','Ahmed Al-Saud','ahmed@alnoor.sa','+966-50-123-4567','SA','Riyadh','USD','en','战略合作',0.08);

-- 8) 报价单样例（1 份）
INSERT INTO quotations (id, quote_no, customer_id, status, currency, language, incoterms, port_of_loading, port_of_destination, payment_terms, lead_time, valid_days, valid_until, exchange_rate, tax_rate, insurance_rate, created_by) VALUES
('bbbb2222-0000-0000-0000-000000000001',
 'YW-QT-20241201-001',
 (SELECT id FROM customers WHERE customer_code='VN-001'),
 '已发送','USD','vi',
 'FOB','Qingdao, China','Ho Chi Minh City, Vietnam',
 'T/T 30% đặt cọc, 70% còn lại khi nhận bản sao B/L',
 '25-30 ngày làm việc sau khi nhận đặt cọc',
 30, (NOW() + INTERVAL '30 days')::DATE,
 1.0000, 0.0000, 0.0030, 'demo-user');

INSERT INTO quotation_items (quotation_id, product_id, line_no, product_name_output, sku, spec, unit, quantity, cartons, cost_price, margin_rate, unit_price, total_price, gross_weight, cbm) VALUES
('bbbb2222-0000-0000-0000-000000000001',
 'aaaa1111-0000-0000-0000-000000000001', 1, 'Ức gà sấy thăng hoa 50g','YW-FD-CHK-050','50g/袋 * 80 袋/箱','袋',
 2000, 25, 0.45, 0.35, 0.6923, 1384.60, 160.000, 0.500),
('bbbb2222-0000-0000-0000-000000000001',
 'aaaa1111-0000-0000-0000-000000000002', 2, 'Pate cá ngừ cho mèo 15g*7','YW-CP-TUN-015','15g*7 支/盒 * 24 盒/箱','盒',
 500, 21, 0.85, 0.32, 1.2500, 625.00, 126.000, 0.525);
