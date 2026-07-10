# 云威宠物食品报价系统 / Yunwei Petfood Quotation System

> 中国宠物食品工厂面向东南亚/中东/东北亚 B 端批发客户的专业报价单（Quotation）和形式发票（Proforma Invoice）管理系统。
> Next.js 15 + TypeScript + Tailwind + Shadcn-style UI + Supabase + @react-pdf/renderer + SheetJS

## ✨ 核心功能

- **报价单创建**：左侧配置 + 右侧实时预览，3 语言切换（中/EN/VI）
- **阶梯价格**：同一产品支持多档（散货/整箱/VIP），数量变化自动匹配
- **价格引擎**：成本加成、含税、CIF、保险费、客户折扣叠加、利润分析
- **多语言 PDF**：`@react-pdf/renderer` 服务端渲染 Quotation / PI（中/EN/VI）
- **Excel 导出**：SheetJS 完整明细 + 货物信息
- **PI 模板**：在 Quotation 基础上增加银行账户、受益人、公章
- **报价单号自动生成**：`YW-QT-YYYYMMDD-XXX` / `YW-PI-YYYYMMDD-XXX`
- **版本管理**：草稿可直接编辑，已发送需「改版」生成新版本
- **数据可视化**：控制台折线图（Recharts）
- **响应式 UI**：桌面端 1280+ 完整支持，平板 768+ 查看

## 🏗 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 15 (App Router) + React 19 RC |
| 语言 | TypeScript 5.6 (strict) |
| 样式 | Tailwind CSS 3.4 + Shadcn-style 组件 |
| 数据库 | Supabase (PostgreSQL 15) |
| PDF | @react-pdf/renderer 4 |
| Excel | xlsx (SheetJS) |
| 表单 | React Hook Form + Zod |
| 状态 | Zustand |
| 图表 | Recharts |
| 图标 | Lucide React |
| 精度 | decimal.js |

## 📁 目录结构

```
.
├── app/                              # Next.js 15 App Router
│   ├── dashboard/                    # 控制台首页
│   ├── products/                     # 产品库
│   ├── customers/                    # 客户库
│   ├── quotations/
│   │   ├── page.tsx                  # 报价单列表
│   │   └── new/page.tsx              # 报价单创建（核心）
│   ├── proforma-invoices/            # PI 列表
│   ├── settings/                     # 系统设置
│   └── api/quotations/[no]/
│       ├── pdf/route.ts              # PDF 服务端渲染
│       └── xlsx/route.ts             # Excel 导出
├── components/
│   ├── layout/                       # Sidebar / Header
│   ├── ui/                           # Button/Input/Card/Drawer/Tabs/Toast/Table
│   ├── quotation-builder/
│   │   └── QuotationPreview.tsx      # 实时预览组件
│   └── pdf-templates/
│       └── QuotationPdf.tsx          # @react-pdf/renderer 模板
├── lib/
│   ├── calculations/                 # 价格计算引擎
│   │   ├── decimal.ts                # decimal.js 包装
│   │   ├── priceEngine.ts            # 核心算法
│   │   └── quoteNo.ts                # 报价单号生成
│   ├── i18n/
│   │   └── outputTranslations.ts     # 三语言字段映射
│   ├── supabase/
│   │   ├── client.ts                 # Supabase 客户端（浏览器/SSR/Service）
│   │   └── data.ts                   # 数据访问层（含 Mock 兜底）
│   └── utils.ts                      # cn() 工具
├── supabase/
│   ├── config.toml                   # Supabase 本地配置
│   ├── migrations/
│   │   └── 0001_init_schema.sql      # 9 张表 + RLS + 触发器
│   └── seed.sql                      # 示例数据
├── types/index.ts                    # 全部 TypeScript 类型
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 推荐使用 pnpm
pnpm install
# 或 npm
npm install
```

### 2. 配置 Supabase（数据库）

#### 选项 A：使用 Supabase Cloud
1. 在 https://supabase.com 创建项目
2. 复制项目 URL 和 anon key 到 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```
3. 在 Supabase Dashboard → SQL Editor 中执行：
   - `supabase/migrations/0001_init_schema.sql`（建表 + RLS）
   - `supabase/seed.sql`（可选：插入示例数据）

#### 选项 B：本地 Supabase
```bash
# 安装 Supabase CLI
brew install supabase/tap/supabase   # macOS
# 或 https://github.com/supabase/cli/releases 下载

# 启动本地数据库
supabase start

# 执行迁移
supabase db push

# 导入种子数据
supabase db seed
```

### 3. 启动开发服务器

```bash
pnpm dev
# → http://localhost:3000
```

> 💡 **未配置 Supabase 时**：系统自动使用 Mock 数据，UI 完整可演示，PDF/Excel 导出接口会返回说明提示。

## 📊 关键业务规则

### 价格计算

```
unit_price = cost_price / (1 - margin_rate)
含税单价    = unit_price * (1 + tax_rate)
客户折扣    = unit_price * (1 - customer.default_discount)
CIF 总价    = FOB + 保险 + 运费
保险费     = (小计 / (1+税率)) * 保险费率
```

### 阶梯价格优先级

```
1. 匹配 product_tier_prices 中 (qty >= min_qty AND qty <= max_qty) 的档位
2. 若该档位有 price_usd → 直接使用
3. 否则使用该档位的 margin_rate 计算
4. 无匹配档位 → 用默认 margin_rate
```

### 报价单号格式

```
YW-QT-20241201-001    今日第 1 份报价单
YW-PI-20241201-001    今日第 1 份 PI
VN-001                越南第 1 个客户
```

## 🔐 权限模型

| 角色 | 能力 |
|------|------|
| **超级管理员** | 全部权限 + 系统设置 + 查看利润 |
| **销售经理** | 全部报价单 + 审批超折扣 + 报表 |
| **业务员** | 仅自己的报价单、不可见成本价/利润率 |

> 当前实现为前端 `data.ts` 抽象层，Supabase RLS 策略已编写（`0001_init_schema.sql` 末尾）。

## 📦 部署到 Vercel

```bash
# 1. 推送到 GitHub
git init && git add . && git commit -m "init"
git remote add origin <your-repo>
git push -u origin main

# 2. 在 Vercel Dashboard
# - Import Project → 选择仓库
# - Framework: Next.js
# - 添加环境变量（同 .env.local）
# - Deploy

# 3. Supabase Storage
# 创建 bucket: company-assets
# 上传 logo.png / seal.png
# 将 URL 填入 设置 → 公司信息
```

## 🗂 数据库表清单

| 表 | 说明 |
|------|------|
| `company_profile` | 公司信息（含银行账户 JSONB） |
| `products` | 产品库 |
| `product_tier_prices` | 阶梯价格 |
| `customers` | 客户库 |
| `quotations` | 报价单主表 |
| `quotation_items` | 报价单明细 |
| `terms_templates` | 条款模板 |
| `rate_configs` | 费率/汇率配置 |
| `quotation_followups` | 跟进记录 |
| `product_categories` | 产品大类 |
| `user_roles` | 用户角色 |

## 🛣 开发路线

- ✅ **Phase 1（MVP）**：数据库 + 产品/客户 CRUD + 基础报价单 + 英文 PDF
- ✅ **Phase 2（完整）**：阶梯价格 + 多语言 PDF + PI + Excel + 版本管理
- ✅ **Phase 3（高级）**：权限 + 报表 + 审批流
- 🔜 **Phase 4（扩展）**：可分享只读链接 + WhatsApp 一键发送 + 邮件跟踪像素

## 📞 联系

邢台云威进出口有限公司 / Xingtai Yunwei Import and Export Co., Ltd.
- 📧 sales@xtyunwei.com
- 📞 +86-319-8888-6666
- 🌐 https://www.xtyunwei.com
