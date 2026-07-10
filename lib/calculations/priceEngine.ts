/**
 * 价格计算引擎 — Yunwei Petfood Quotation
 *
 * 核心规则（与 CodeX Prompt 第四章保持一致）：
 *  1. cost-plus:     unit_price = cost_price / (1 - margin_rate)
 *  2. 含税:          tax_inclusive_price = unit_price * (1 + tax_rate)
 *  3. CIF:           cif = fob + insurance + freight
 *  4. 阶梯价:        优先 price_usd → 否则 margin_rate → 否则默认
 *  5. 客户折扣:      final = unit_price * (1 - customer.default_discount)
 *  6. 箱重体积:      cartons = CEIL(qty / pcs_per_carton)
 *  7. 利润:          profit = (unit_price - cost) * qty
 */

import Decimal from 'decimal.js';
import { D, round2, round4, safe } from './decimal';
import type {
  PriceCalcInput,
  PriceCalcResult,
  QuotationItem,
  Product,
  ProductTierPrice,
  LogisticsCalc,
  Incoterm,
} from '@/types';

// ──────────────────────────────────────────────────────────────
// 1) 单价计算（成本加成 / 直接价 / 手动覆盖）
// ──────────────────────────────────────────────────────────────
export function calcUnitPrice(input: PriceCalcInput): PriceCalcResult {
  const cost = D(input.costPrice);
  const margin = D(safe(input.marginRate, 0.35));
  const tax = D(safe(input.taxRate, 0));
  const discount = D(safe(input.customerDiscount, 0));

  // 1) 基础单价
  let baseUnit: Decimal;
  if (input.manualUnitPrice != null && Number.isFinite(input.manualUnitPrice)) {
    baseUnit = D(input.manualUnitPrice);
  } else if (margin.gte(1)) {
    baseUnit = cost.mul(2); // 防呆
  } else {
    baseUnit = cost.div(D(1).minus(margin));
  }

  // 2) 客户折扣
  const unitBeforeDiscount = baseUnit;
  const finalUnit = baseUnit.mul(D(1).minus(discount));

  // 3) 含税
  const taxInclusive = finalUnit.mul(D(1).plus(tax));

  // 4) 利润分析
  const profit = finalUnit.minus(cost);
  const marginPct = finalUnit.gt(0) ? profit.div(finalUnit).mul(100) : new Decimal(0);
  const effectiveMargin = cost.gt(0)
    ? D(1).minus(cost.div(finalUnit.gt(0) ? finalUnit : D(1)))
    : new Decimal(0);

  return {
    unitPrice: round4(finalUnit),
    unitPriceBeforeDiscount: round4(unitBeforeDiscount),
    totalPrice: round2(finalUnit), // 单行小计在 calcItemTotal 中按数量重算
    taxInclusivePrice: round4(taxInclusive),
    grossProfit: round4(profit),
    grossMargin: Number(marginPct.toFixed(2)),
    effectiveMarginRate: Number(effectiveMargin.toFixed(4)),
  };
}

// ──────────────────────────────────────────────────────────────
// 2) 阶梯价解析
// ──────────────────────────────────────────────────────────────
export function resolveTierPrice(
  tiers: ProductTierPrice[],
  qty: number,
  fallback: { costPrice: number; defaultMargin: number },
): { priceUsd: number | null; marginRate: number; tierName: string | null } {
  const matched = tiers
    .filter((t) => qty >= t.min_qty && (t.max_qty == null || qty <= t.max_qty))
    .sort((a, b) => a.min_qty - b.min_qty)[0];

  if (matched) {
    return {
      priceUsd: matched.price_usd,
      marginRate: matched.margin_rate ?? fallback.defaultMargin,
      tierName: matched.tier_name,
    };
  }
  return { priceUsd: null, marginRate: fallback.defaultMargin, tierName: null };
}

// ──────────────────────────────────────────────────────────────
// 3) 单行明细完整计算（数量+箱数+毛重+体积+小计）
// ──────────────────────────────────────────────────────────────
export function buildQuotationItem(args: {
  product: Product;
  quantity: number;
  tiers: ProductTierPrice[];
  lineNo: number;
  marginOverride?: number;        // 手动覆盖的利润率
  customerDiscount?: number;      // 0~1
  taxRate?: number;
  manualUnitPrice?: number | null;
  defaultMargin: number;
  productNameOutput?: string;
  notes?: string;
}): QuotationItem & { grossProfit: number; grossMargin: number } {
  const {
    product, quantity, tiers, lineNo,
    marginOverride, customerDiscount = 0,
    taxRate = 0, manualUnitPrice,
    defaultMargin, productNameOutput, notes,
  } = args;

  const qty = Math.max(0, Math.floor(safe(quantity, 0)));
  const pcs = Math.max(1, safe(product.pcs_per_carton, 1));
  const cartons = Math.ceil(qty / pcs);

  // 阶梯价
  const tier = resolveTierPrice(tiers, qty, {
    costPrice: safe(product.cost_price, 0),
    defaultMargin,
  });

  const finalPrice = manualUnitPrice ?? tier.priceUsd ?? null;
  const marginRate = marginOverride ?? tier.marginRate;

  const calc = calcUnitPrice({
    costPrice: safe(product.cost_price, 0),
    marginRate,
    taxRate,
    customerDiscount,
    manualUnitPrice: finalPrice,
  });

  const total = D(calc.unitPrice).mul(qty);
  const grossWeight = D(cartons).mul(safe(product.carton_gross_weight, 0));
  const cbm = D(cartons).mul(safe(product.carton_cbm, 0));

  return {
    product_id: product.id,
    line_no: lineNo,
    product_name_output: productNameOutput ?? pickProductName(product, 'en'),
    sku: product.sku,
    spec: product.spec ?? '',
    unit: product.unit ?? '袋',
    quantity: qty,
    cartons,
    cost_price: safe(product.cost_price, 0),
    margin_rate: marginRate,
    unit_price: calc.unitPrice,
    total_price: round2(total),
    gross_weight: Number(grossWeight.toFixed(3)),
    cbm: Number(cbm.toFixed(6)),
    notes,
    grossProfit: round2(D(calc.grossProfit).mul(qty)),
    grossMargin: calc.grossMargin,
  };
}

export function pickProductName(p: Product, lang: 'zh' | 'en' | 'vi'): string {
  if (lang === 'vi') return p.name_vi || p.name_en || p.name_zh;
  if (lang === 'en') return p.name_en || p.name_zh;
  return p.name_zh;
}

// ──────────────────────────────────────────────────────────────
// 4) 报价单汇总（物流费、保险、利润、汇率）
// ──────────────────────────────────────────────────────────────
export function summarizeQuotation(args: {
  items: QuotationItem[];
  logisticsCost: number;
  insuranceRate: number;
  taxRate: number;
  incoterms: Incoterm;
  exchangeRate?: number;
}): LogisticsCalc {
  const { items, logisticsCost, insuranceRate, taxRate, incoterms, exchangeRate = 1 } = args;

  let subtotal = D(0);
  let totalCartons = 0;
  let totalGrossWeight = D(0);
  let totalCbm = D(0);
  let totalCost = D(0);
  let totalProfit = D(0);

  for (const it of items) {
    subtotal = subtotal.plus(D(safe(it.total_price, 0)));
    totalCartons += safe(it.cartons, 0);
    totalGrossWeight = totalGrossWeight.plus(D(safe(it.gross_weight, 0)));
    totalCbm = totalCbm.plus(D(safe(it.cbm, 0)));
    totalCost = totalCost.plus(D(safe(it.cost_price, 0)).mul(safe(it.quantity, 0)));
    // 单行利润（已扣客户折扣）
    const lineProfit = D(safe(it.unit_price, 0)).minus(D(safe(it.cost_price, 0)))
      .mul(safe(it.quantity, 0));
    totalProfit = totalProfit.plus(lineProfit);
  }

  // 保险 = (小计 / (1+税率)) * 保险费率 — 仅在 CIF/CFR 启用
  const useInsurance = incoterms === 'CIF' || incoterms === 'CFR';
  const insuranceBase = subtotal.div(D(1).plus(D(taxRate)));
  const insurance = useInsurance ? insuranceBase.mul(D(insuranceRate)) : D(0);
  const freightPerCarton = totalCartons > 0 ? D(logisticsCost).div(totalCartons) : D(0);

  const total = subtotal.plus(D(logisticsCost)).plus(insurance);

  const totalMargin = subtotal.gt(0)
    ? totalProfit.div(subtotal).mul(100).toNumber()
    : 0;

  return {
    totalCartons,
    totalGrossWeight: Number(totalGrossWeight.toFixed(3)),
    totalCbm: Number(totalCbm.toFixed(6)),
    insurance: round2(insurance),
    freightPerCarton: Number(freightPerCarton.toFixed(4)),
    subtotal: round2(subtotal),
    total: round2(total),
    totalProfit: round2(totalProfit),
    totalMargin: Number(totalMargin.toFixed(2)),
  };
}

// ──────────────────────────────────────────────────────────────
// 5) 报价单号生成（YW-QT-YYYYMMDD-XXX / YW-PI-...）
// ──────────────────────────────────────────────────────────────
export function generateQuoteNo(date: Date, todayCount: number, prefix: 'QT' | 'PI' = 'QT'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(todayCount + 1).padStart(3, '0');
  return `YW-${prefix}-${y}${m}${d}-${seq}`;
}

export function generateCustomerCode(country: string, existingCount: number): string {
  return `${country.toUpperCase()}-${String(existingCount + 1).padStart(3, '0')}`;
}

// ──────────────────────────────────────────────────────────────
// 6) 货币换算
// ────────────────────────────────────────────────────────���─────
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>, // { USD: 1, CNY: 7.25, VND: 25000, ... }
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  // amount 是 from 货币，先换算成 USD，再换算到 to
  const usd = D(amount).div(fromRate);
  return round2(usd.mul(toRate));
}
