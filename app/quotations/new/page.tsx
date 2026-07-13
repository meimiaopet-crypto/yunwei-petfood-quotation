'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { data } from '@/lib/supabase/data';
import {
  Save, FileDown, FileText, FileSpreadsheet, Link as LinkIcon, Plus, Trash2,
  Calculator, Search, User, Calendar, Globe, Truck, ShieldCheck,
} from 'lucide-react';
import type {
  Product, ProductTierPrice, Customer, QuotationItem, TermsTemplate,
  Quotation, Incoterm, LogisticsType, Locale, Currency, QuotationStatus, CompanyProfile,
} from '@/types';
import { buildQuotationItem, summarizeQuotation } from '@/lib/calculations/priceEngine';
import { nextSeq } from '@/lib/calculations/quoteNo';
import { QuotationPreview } from '@/components/quotation-builder/QuotationPreview';

const INCOTERMS: Incoterm[] = ['FOB', 'CIF', 'CFR', 'EXW'];
const LOGISTICS: LogisticsType[] = ['海运', '空运', '陆运'];
const CURRENCIES: Currency[] = ['USD', 'CNY', 'VND', 'MYR', 'THB', 'SAR', 'AED'];

export default function NewQuotationPage() {
  const toast = useToast();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const [company, setCompany] = React.useState<CompanyProfile | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [tiers, setTiers] = React.useState<ProductTierPrice[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [terms, setTerms] = React.useState<TermsTemplate[]>([]);
  const [rates, setRates] = React.useState<Record<string, string>>({});
  const [previewLang, setPreviewLang] = React.useState<Locale>('en');
  const [productSearch, setProductSearch] = React.useState('');
  const [showProductPicker, setShowProductPicker] = React.useState(false);

  // 报价单主数据
  const [quoteNo, setQuoteNo] = React.useState('');
  const [customerId, setCustomerId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<QuotationStatus>('草稿');
  const [currency, setCurrency] = React.useState<Currency>('USD');
  const [incoterms, setIncoterms] = React.useState<Incoterm>('FOB');
  const [portOfLoading, setPortOfLoading] = React.useState('Qingdao, China');
  const [portOfDestination, setPortOfDestination] = React.useState('');
  const [paymentTerms, setPaymentTerms] = React.useState('T/T 30% deposit, 70% before shipment');
  const [leadTime, setLeadTime] = React.useState('25-30 working days after deposit received');
  const [validDays, setValidDays] = React.useState(30);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [exchangeRate, setExchangeRate] = React.useState(1);
  const [exchangeRateLocked, setExchangeRateLocked] = React.useState(false);
  const [logisticsCost, setLogisticsCost] = React.useState(0);
  const [logisticsType, setLogisticsType] = React.useState<LogisticsType>('海运');
  const [taxRate, setTaxRate] = React.useState(0);
  const [insuranceRate, setInsuranceRate] = React.useState(0.003);
  const [otherCharges, setOtherCharges] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  const [internalNotes, setInternalNotes] = React.useState('');
  const [marginRate, setMarginRate] = React.useState(0.35);
  const [items, setItems] = React.useState<QuotationItem[]>([]);
  const [selectedTermIds, setSelectedTermIds] = React.useState<string[]>([]);

  // 加载数据
  React.useEffect(() => {
    (async () => {
      const [co, ps, ts, cs, tms, rts] = await Promise.all([
        data.company.get(), data.products.list(), data.products.tiers(),
        data.customers.list(), data.terms.list(), data.rates.getAll(),
      ]);
      setCompany(co); setProducts(ps); setTiers(ts); setCustomers(cs);
      setTerms(tms); setRates(rts);
      setMarginRate(Number(rts.default_margin_rate ?? 0.35));
      setInsuranceRate(Number(rts.default_insurance_rate ?? 0.003));
      setLeadTime(rts.default_lead_time ?? leadTime);
      setValidDays(Number(rts.default_valid_days ?? 30));
      setQuoteNo(nextSeq([], new Date(), 'QT'));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 客户切换时自动填充
  const customer = customers.find((c) => c.id === customerId) ?? null;
  React.useEffect(() => {
    if (!customer) return;
    setCurrency(customer.currency);
    setPreviewLang(customer.language);
    setIncoterms(customer.incoterms);
    setPaymentTerms(customer.payment_terms);
    setPortOfDestination(defaultDestinationPort(customer.country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const validUntil = React.useMemo(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + validDays);
    return d.toISOString().slice(0, 10);
  }, [date, validDays]);

  // 汇总
  const summary = React.useMemo(() => summarizeQuotation({
    items, logisticsCost, insuranceRate, taxRate, incoterms, exchangeRate,
  }), [items, logisticsCost, insuranceRate, taxRate, incoterms, exchangeRate]);

  const addItem = (p: Product) => {
    const built = buildQuotationItem({
      product: p, quantity: p.pcs_per_carton, tiers: tiers.filter((t) => t.product_id === p.id),
      lineNo: items.length + 1, customerDiscount: customer?.default_discount ?? 0,
      taxRate, defaultMargin: marginRate, marginOverride: marginRate,
    });
    setItems((arr) => [...arr, built]);
    setShowProductPicker(false);
    setProductSearch('');
  };

  const updateItem = (idx: number, patch: Partial<QuotationItem>) => {
    setItems((arr) => arr.map((it, i) => {
      if (i !== idx) return it;
      const product = products.find((p) => p.id === it.product_id);
      if (!product) return { ...it, ...patch };
      // 重新构建该行
      const next = buildQuotationItem({
        product,
        quantity: patch.quantity ?? it.quantity,
        tiers: tiers.filter((t) => t.product_id === product.id),
        lineNo: it.line_no,
        marginOverride: patch.margin_rate ?? it.margin_rate,
        customerDiscount: customer?.default_discount ?? 0,
        taxRate,
        defaultMargin: marginRate,
        manualUnitPrice: patch.unit_price,
        productNameOutput: patch.product_name_output ?? it.product_name_output,
        notes: patch.notes ?? it.notes,
      });
      return next;
    }));
  };

  const removeItem = (idx: number) => {
    if (!confirm('确定删除该行？')) return;
    setItems((arr) => arr.filter((_, i) => i !== idx).map((it, i) => ({ ...it, line_no: i + 1 })));
  };

  const [savedQuoteNo, setSavedQuoteNo] = React.useState<string | null>(null);
  const handleSave = async (): Promise<string | null> => {
    if (!customerId) { toast.push({ type: 'warning', title: '请先选择客户' }); return null; }
    if (items.length === 0) { toast.push({ type: 'warning', title: '请至少添加一个产品' }); return null; }
    const q: Quotation = {
      quote_no: quoteNo, customer_id: customerId, status, currency,
      language: previewLang, incoterms, port_of_loading: portOfLoading,
      port_of_destination: portOfDestination, payment_terms: paymentTerms,
      lead_time: leadTime, valid_days: validDays, valid_until: validUntil,
      exchange_rate: exchangeRate, exchange_rate_locked: exchangeRateLocked,
      logistics_cost: logisticsCost, logistics_type: logisticsType,
      tax_rate: taxRate, insurance_rate: insuranceRate,
      other_charges: otherCharges, notes, internal_notes: internalNotes,
      lost_reason: null, version: 1, parent_quote_id: null, created_by: 'demo-user',
      sent_at: null, items, selected_term_ids: selectedTermIds,
    };
    try {
      const saved = await data.quotations.save(q);
      setSavedQuoteNo(saved.quote_no);
      setQuoteNo(saved.quote_no);
      toast.push({ type: 'success', title: '草稿已保存', description: saved.quote_no });
      return saved.quote_no;
    } catch (e: any) {
      console.error('[handleSave] failed', e);
      toast.push({ type: 'error', title: '保存失败', description: e?.message || String(e) });
      return null;
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const k = productSearch.toLowerCase();
    return `${p.sku} ${p.name_zh} ${p.name_en} ${p.name_vi ?? ''}`.toLowerCase().includes(k);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 -m-6 min-h-[calc(100vh-3.5rem)]">
      {/* ====== 左侧配置区 60% ====== */}
      <div className="lg:col-span-3 p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">新建报价单</h1>
            <p className="text-sm text-muted mt-0.5">报价单号：<span className="font-mono">{quoteNo}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={status === '草稿' ? 'gray' : status === '赢单' ? 'green' : 'blue'}>{status}</Badge>
            <Button variant="outline" onClick={handleSave}><Save className="w-4 h-4" />保存草稿</Button>
          </div>
        </div>

        {/* 区块1 — 基本信息 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" />基本信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="选择客户 *">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={customerId ?? ''} onChange={(e) => setCustomerId(e.target.value || null)}>
                <option value="">— 请选择客户 —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.customer_code} · {c.company_name}</option>
                ))}
              </select>
            </Field>
            <Field label="报价单号">
              <Input value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} />
            </Field>
            <Field label="报价日期">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="有效期（天）">
              <Input type="number" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
            </Field>
            <Field label="输出语言">
              <Tabs items={[
                { value: 'zh', label: '中文' },
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Tiếng Việt' },
              ]} value={previewLang} onChange={(v) => setPreviewLang(v as Locale)} />
            </Field>
            <Field label="报价币种">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            {customer && (
              <div className="col-span-2 px-3 py-2 rounded-md bg-muted/30 text-xs grid grid-cols-4 gap-2">
                <div><span className="text-muted">国家：</span>{customer.country}</div>
                <div><span className="text-muted">等级：</span>{customer.customer_level}</div>
                <div><span className="text-muted">折扣：</span>{(customer.default_discount * 100).toFixed(0)}%</div>
                <div><span className="text-muted">有效期至：</span>{validUntil}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 区块2 — 贸易条件 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-4 h-4" />贸易条件</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="贸易条款">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={incoterms} onChange={(e) => setIncoterms(e.target.value as Incoterm)}>
                {INCOTERMS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="装货港">
              <Input value={portOfLoading} onChange={(e) => setPortOfLoading(e.target.value)} />
            </Field>
            <Field label="目的港">
              <Input value={portOfDestination} onChange={(e) => setPortOfDestination(e.target.value)} />
            </Field>
            <Field label="交货期">
              <Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} />
            </Field>
            <Field label="付款条件" full>
              <Textarea rows={2} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        {/* 区块3 — 费用设置 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-4 h-4" />费用与汇率</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="全局利润率" hint="单行可覆盖">
              <Input type="number" step="0.01" min="0" max="0.95"
                value={marginRate} onChange={(e) => setMarginRate(Number(e.target.value))} />
            </Field>
            <Field label="税率 / 出口退税率">
              <Input type="number" step="0.01" min="0" max="1"
                value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
            </Field>
            <Field label="保险费率" hint="CIF/CFR 自动启用">
              <Input type="number" step="0.001" min="0"
                value={insuranceRate} onChange={(e) => setInsuranceRate(Number(e.target.value))} />
            </Field>
            <Field label="物流方式">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={logisticsType} onChange={(e) => setLogisticsType(e.target.value as LogisticsType)}>
                {LOGISTICS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="物流费用 (USD)">
              <Input type="number" step="0.01" value={logisticsCost}
                onChange={(e) => setLogisticsCost(Number(e.target.value))} />
            </Field>
            <Field label="其他费用 (USD)">
              <Input type="number" step="0.01" value={otherCharges}
                onChange={(e) => setOtherCharges(Number(e.target.value))} />
            </Field>
            <Field label={`汇率（1 USD = ? ${currency}）`}>
              <div className="flex gap-2">
                <Input type="number" step="0.0001" value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))} />
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={exchangeRateLocked} onChange={(e) => setExchangeRateLocked(e.target.checked)} />
                  锁定
                </label>
              </div>
            </Field>
            <Field label="报价单状态">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={status} onChange={(e) => setStatus(e.target.value as QuotationStatus)}>
                {['草稿','已发送','谈判中','赢单','输单','过期'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </CardContent>
        </Card>

        {/* 区块4 — 产品明细 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" />产品明细</span>
              <Button size="sm" onClick={() => setShowProductPicker(true)}>
                <Plus className="w-4 h-4" />添加产品
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium w-10">#</th>
                    <th className="text-left px-3 py-2 font-medium">产品名称</th>
                    <th className="text-left px-3 py-2 font-medium w-24">规格</th>
                    <th className="text-right px-3 py-2 font-medium w-20">数量</th>
                    <th className="text-right px-3 py-2 font-medium w-16">箱数</th>
                    <th className="text-right px-3 py-2 font-medium w-20">毛重</th>
                    <th className="text-right px-3 py-2 font-medium w-16">CBM</th>
                    <th className="text-right px-3 py-2 font-medium w-16">利润率</th>
                    <th className="text-right px-3 py-2 font-medium w-24">单价</th>
                    <th className="text-right px-3 py-2 font-medium w-28">小计</th>
                    <th className="text-right px-3 py-2 font-medium w-20">利润</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="px-3 py-2 text-muted">{it.line_no}</td>
                      <td className="px-3 py-2">
                        <Input className="h-8 text-sm" value={it.product_name_output ?? ''}
                          onChange={(e) => updateItem(idx, { product_name_output: e.target.value })} />
                        <div className="text-xs text-muted mt-0.5 font-mono">{it.sku}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{it.spec}</td>
                      <td className="px-3 py-2">
                        <Input className="h-8 text-sm text-right" type="number" min="0"
                          value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{it.cartons}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs">{it.gross_weight?.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs">{it.cbm?.toFixed(4)}</td>
                      <td className="px-3 py-2">
                        <Input className="h-8 text-xs text-right" type="number" step="0.01"
                          value={it.margin_rate ?? marginRate}
                          onChange={(e) => updateItem(idx, { margin_rate: Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-2">
                        <Input className="h-8 text-sm text-right tabular-nums" type="number" step="0.0001"
                          value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">${it.total_price?.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        <div className="text-success font-medium">
                          ${((it.unit_price - (it.cost_price ?? 0)) * it.quantity).toFixed(2)}
                        </div>
                        <div className="text-muted">
                          {(((it.unit_price - (it.cost_price ?? 0)) / (it.unit_price || 1)) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-2">
                        <button className="p-1 rounded hover:bg-red-50 text-danger" onClick={() => removeItem(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={12} className="px-3 py-10 text-center text-muted">
                      点击右上角「添加产品」开始
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 汇总 */}
            <div className="px-5 py-4 border-t border-border bg-muted/20 grid grid-cols-2 gap-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">总箱数</span><span className="tabular-nums font-medium">{summary.totalCartons}</span></div>
                <div className="flex justify-between"><span className="text-muted">总毛重</span><span className="tabular-nums font-medium">{summary.totalGrossWeight.toFixed(3)} kg</span></div>
                <div className="flex justify-between"><span className="text-muted">总体积</span><span className="tabular-nums font-medium">{summary.totalCbm.toFixed(4)} CBM</span></div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">小计</span><span className="tabular-nums">${summary.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted">物流费</span><span className="tabular-nums">${logisticsCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted">保险费</span><span className="tabular-nums">${summary.insurance.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted">其他</span><span className="tabular-nums">${otherCharges.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
                  <span className="font-semibold">总金额</span>
                  <span className="font-bold text-lg text-brand tabular-nums">${(summary.total + otherCharges).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">内部：总利润 / 利润率</span>
                  <span className="text-orange-600 font-medium">${summary.totalProfit.toFixed(2)} / {summary.totalMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 区块5 — 备注与条款 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" />备注与条款</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="客户可见备注（出现在报价单底部）">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="如：报价含原产地证、卫生证书..." />
            </Field>
            <Field label="内部备注（仅内部可见，不出现在报价单）">
              <div className="border-2 border-dashed border-danger/40 rounded-md p-1">
                <Textarea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="如：客户已确认打样，等待最终确认..." className="border-0" />
              </div>
            </Field>
            <div>
              <Label>条款（可多选）</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {terms.map((t) => (
                  <label key={t.id} className="flex items-start gap-2 p-2.5 border border-border rounded-md cursor-pointer hover:bg-muted/30">
                    <input type="checkbox" className="mt-0.5"
                      checked={selectedTermIds.includes(t.id)}
                      onChange={(e) => setSelectedTermIds((arr) => e.target.checked ? [...arr, t.id] : arr.filter((x) => x !== t.id))} />
                    <div className="text-xs">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-muted line-clamp-1">{t.content_zh || t.content_en || t.content_vi}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== 右侧实时预览 40% ====== */}
      <div className="lg:col-span-2 bg-white border-l border-border flex flex-col">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium"><Globe className="w-4 h-4" />实时预览</div>
          <Tabs items={[
            { value: 'zh', label: '中文' },
            { value: 'en', label: 'EN' },
            { value: 'vi', label: 'VI' },
          ]} value={previewLang} onChange={(v) => setPreviewLang(v as Locale)} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          <QuotationPreview
            company={company}
            customer={customer}
            items={items}
            summary={summary}
            meta={{
              quoteNo, date, validUntil, language: previewLang, currency, incoterms,
              portOfLoading, portOfDestination, paymentTerms, leadTime, logisticsCost,
              logisticsType, taxRate, insuranceRate, otherCharges, notes,
            }}
            terms={terms.filter((t) => selectedTermIds.includes(t.id))}
            showProfit={true}
          />
        </div>
        <div className="px-5 py-3 border-t border-border flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSave}><Save className="w-3.5 h-3.5" />保存草稿</Button>
          <Button size="sm" variant="outline" onClick={() => downloadPdf('quotation')}>
            <FileText className="w-3.5 h-3.5" />导出报价单 PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadPdf('pi')}>
            <FileDown className="w-3.5 h-3.5" />导出 PI
          </Button>
          <Button size="sm" variant="outline" onClick={downloadExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" />导出 Excel
          </Button>
          <Button size="sm" variant="ghost" onClick={copyLink}>
            <LinkIcon className="w-3.5 h-3.5" />复制链接
          </Button>
        </div>
      </div>

      {/* 产品选择弹层 */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-border">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">选择产品</h3>
              <button onClick={() => setShowProductPicker(false)} className="text-muted text-sm">关闭 ✕</button>
            </div>
            <div className="px-5 py-3 border-b border-border relative">
              <Search className="w-4 h-4 absolute left-8 top-1/2 -translate-y-1/2 text-muted" />
              <Input className="pl-9" placeholder="搜索 SKU / 产品名" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} autoFocus />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addItem(p)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 text-left border-b border-border">
                  <div>
                    <div className="font-medium">{p.name_zh}</div>
                    <div className="text-xs text-muted">{p.name_en} · {p.sku} · {p.spec}</div>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <div>成本 ${p.cost_price}</div>
                    <div className="text-brand">建议 ${(p.cost_price / 0.65).toFixed(4)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- handlers for actions ----
  async function downloadPdf(kind: 'quotation' | 'pi') {
    // 第一次导出：自动先保存草稿（保证数据库里有该 quote_no）
    let useNo = savedQuoteNo;
    if (!useNo) {
      useNo = await handleSave();
      if (!useNo) return; // 保存失败，不打开
    }
    const url = `/api/quotations/${encodeURIComponent(useNo)}/pdf?lang=${previewLang}&kind=${kind}`;
    window.open(url, '_blank');
  }
  async function downloadExcel() {
    let useNo = savedQuoteNo;
    if (!useNo) {
      useNo = await handleSave();
      if (!useNo) return;
    }
    const url = `/api/quotations/${encodeURIComponent(useNo)}/xlsx?lang=${previewLang}`;
    window.open(url, '_blank');
  }
  function copyLink() {
    const link = `${window.location.origin}/quotations/${quoteNo}/view`;
    navigator.clipboard?.writeText(link);
    toast.push({ type: 'success', title: '链接已复制', description: link });
  }
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'col-span-2 space-y-1.5' : 'space-y-1.5'}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function defaultDestinationPort(country: string): string {
  const m: Record<string, string> = {
    VN: 'Ho Chi Minh City, Vietnam', MY: 'Port Klang, Malaysia',
    TH: 'Bangkok, Thailand', SA: 'Dammam, Saudi Arabia', AE: 'Jebel Ali, UAE',
    ID: 'Tanjung Priok, Indonesia', PH: 'Manila, Philippines',
    JP: 'Yokohama, Japan', KR: 'Busan, Korea', SG: 'Singapore',
  };
  return m[country] ?? '';
}
