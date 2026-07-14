# 云伟宠物食品报价系统 · 项目交付清单

> 本系统为外贸宠物食品工厂（邢台云伟进出口有限公司）面向 B 端批发客户（东南亚、中东、东北亚）的专业报价单 / 形式发票管理系统。

## 一句话总结

- **前端**：Next.js 15 + TypeScript + Tailwind，6 个核心页面，3 语言切换（中/EN/VI）
- **后端**：Supabase PostgreSQL（11 张表 + RLS + 触发器 + 报价单号生成函数）
- **核心算法**：decimal.js 价格引擎（成本加成 / 阶梯价 / 含税 / CIF / 客户折扣 / 利润分析）
- **导出**：`@react-pdf/renderer` 多语言 PDF + SheetJS Excel
- **演示模式**：无 Supabase 时使用 Mock 数据，UI 完整可演示

## 快速启动

```bash
# 1. 复制环境变量
cp .env.example .env.local

# 2. 安装依赖
npm install

# 3. 启动
npm run dev    # → http://localhost:3000
```

可选：连接 Supabase 启用 PDF/Excel 服务端导出与跨设备同步。

## 7 大核心页面

| 路径 | 功能 |
|------|------|
| `/dashboard` | 控制台：4 个统计卡片 + 6 月趋势折线图 + 待跟进 + 即将过期 + 最近报价 |
| `/products` | 产品库：6 大类 Tab 过滤、搜索、CRUD Drawer（4 个 Tab）+ 阶梯价表 + 实时建议售价 |
| `/customers` | 客户库：按国家/等级筛选、CRUD Drawer（贸易偏好 + 历史记录）|
| `/quotations/new` | **核心页面**：左侧 5 个区块配置 + 右侧实时 PDF 预览 + 3 语言切换 + 4 个导出动作 |
| `/quotations` | 列表页：状态/国家/搜索筛选、状态色标签、查看/编辑/复制/改版/下载/删除 |
| `/proforma-invoices` | PI 列表 + 从报价单生成 PI |
| `/settings` | 公司信息（Logo/公章/银行账户）+ 默认费率/汇率 + 条款模板库 + 产品大类 |

## 关键文件

| 文件 | 作用 |
|------|------|
| `lib/calculations/priceEngine.ts` | 价格计算引擎（核心算法） |
| `lib/i18n/outputTranslations.ts` | 三语言字段映射（38 个字段） |
| `components/quotation-builder/QuotationPreview.tsx` | 实时预览组件 |
| `components/pdf-templates/QuotationPdf.tsx` | @react-pdf/renderer 模板 |
| `app/api/quotations/[no]/pdf/route.ts` | PDF 服务端渲染 API |
| `app/api/quotations/[no]/xlsx/route.ts` | Excel 导出 API |
| `supabase/migrations/0001_init_schema.sql` | 11 张表 + RLS + 触发器 + 函数 |
| `supabase/seed.sql` | 4 个产品 + 4 个客户 + 3 个条款模板 + 1 份样例报价单 |

## 演示数据（无需 Supabase 即可使用）

- 4 个产品：冻干鸡胸 / 猫条金枪鱼 / 鸡肉罐头 / 无谷三文鱼猫粮
- 4 个客户：越南 Viet Pet（VIP代理）/ 马来西亚 PawPal / 沙特 Al Noor（战略合作）/ 泰国 Bangkok Pet Mart
- 7 条阶梯价规则
- 7 份历史报价单（列表页演示用）
- 2 份 PI（PI 列表演示用）

## PDF 导出（需 Supabase）

```
GET /api/quotations/{quoteNo}/pdf?lang=en&kind=quotation
GET /api/quotations/{quoteNo}/pdf?lang=vi&kind=pi
GET /api/quotations/{quoteNo}/xlsx?lang=zh
```

- `lang`: zh | en | vi
- `kind`: quotation（报价单） | pi（形式发票，含银行账户/公章）
- 返回 `application/pdf` / Excel 二进制流

## 部署

详见 `README.md` 中的"部署到 Vercel"章节。

## 后续待办（Phase 4+）

- [ ] 跟进记录 UI 完整接入
- [ ] Excel 批量导入产品（SheetJS 解析 + 模板下载）
- [ ] 审批流（超折扣弹窗）
- [ ] 可分享只读链接（签名 URL）
- [ ] WhatsApp 一键发送报价
- [ ] 邮件跟踪像素
- [ ] 角色权限完整化（admin/manager/sales 切换）
