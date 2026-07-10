'use client';
import * as React from 'react';
import { data } from '@/lib/supabase/data';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { Search, Plus, Edit2, Trash2, Download, Upload, Box } from 'lucide-react';
import type { Product, ProductTierPrice } from '@/types';
import { buildQuotationItem } from '@/lib/calculations/priceEngine';

const CATEGORIES = ['全部', '冻干零食', '猫条', '猫主粮', '狗主粮', '罐头', '咬胶'];

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [tiers, setTiers] = React.useState<ProductTierPrice[]>([]);
  const [cat, setCat] = React.useState('全部');
  const [kw, setKw] = React.useState('');
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const [ps, ts] = await Promise.all([data.products.list(), data.products.tiers()]);
    setProducts(ps); setTiers(ts);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    if (cat !== '全部' && p.category !== cat) return false;
    if (kw && !`${p.name_zh} ${p.name_en} ${p.sku}`.toLowerCase().includes(kw.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (p: Product) => {
    await data.products.upsert(p);
    toast.push({ type: 'success', title: '已保存', description: p.name_zh });
    setOpen(false); setEditing(null);
    load();
  };
  const handleDelete = async (p: Product) => {
    if (!confirm(`确定删除「${p.name_zh}」？`)) return;
    await data.products.remove(p.id);
    toast.push({ type: 'success', title: '已删除' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">产品库</h1>
          <p className="text-sm text-muted mt-0.5">共 {products.length} 个产品</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="w-4 h-4" />下载模板</Button>
          <Button variant="outline"><Upload className="w-4 h-4" />批量导入</Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4" />新增产品
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Tabs
            items={CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={cat} onChange={setCat}
          />
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-8 w-64" placeholder="搜索产品名 / SKU" value={kw} onChange={(e) => setKw(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">SKU</th>
                <th className="text-left px-4 py-2.5 font-medium">产品名称</th>
                <th className="text-left px-4 py-2.5 font-medium">大类</th>
                <th className="text-left px-4 py-2.5 font-medium">规格</th>
                <th className="text-right px-4 py-2.5 font-medium">成本价</th>
                <th className="text-right px-4 py-2.5 font-medium">建议售价 (35%)</th>
                <th className="text-center px-4 py-2.5 font-medium">Halal</th>
                <th className="text-right px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const cost = Number(p.cost_price);
                const suggested = cost / (1 - 0.35);
                return (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{p.name_zh}</div>
                      <div className="text-xs text-muted">{p.name_en}</div>
                    </td>
                    <td className="px-4 py-2.5"><Badge tone="blue">{p.category}</Badge></td>
                    <td className="px-4 py-2.5 text-muted">{p.spec}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">${cost.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">${suggested.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {p.is_halal ? <Badge tone="green">是</Badge> : <span className="text-muted">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        <button className="p-1.5 rounded hover:bg-muted/40" onClick={() => { setEditing(p); setOpen(true); }} title="编辑">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-danger" onClick={() => handleDelete(p)} title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">
                  <Box className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  暂无产品
                </td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ProductEditor
        open={open}
        product={editing}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

function ProductEditor({
  open, product, onClose, onSave,
}: {
  open: boolean; product: Product | null;
  onClose: () => void; onSave: (p: Product) => void;
}) {
  const [tab, setTab] = React.useState('basic');
  const [form, setForm] = React.useState<Partial<Product>>({});
  React.useEffect(() => {
    setForm(product ?? {
      category: '冻干零食', sku: '', name_zh: '', name_en: '', name_vi: '',
      spec: '', unit: '袋', cost_price: 0, pcs_per_carton: 1,
      carton_gross_weight: 0, carton_net_weight: 0, carton_cbm: 0,
      is_halal: false, is_active: true,
    });
  }, [product, open]);

  const update = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }));

  // 实时计算建议售价
  const suggested = (Number(form.cost_price) || 0) / (1 - 0.35);

  return (
    <Drawer open={open} onClose={onClose} title={product ? '编辑产品' : '新增产品'} width={840}>
      <div className="px-5 py-4 border-b border-border">
        <Tabs
          items={[
            { value: 'basic', label: '基本信息' },
            { value: 'price', label: '成本与价格' },
            { value: 'pack',  label: '包装物流' },
            { value: 'detail',label: '产品详情' },
          ]}
          value={tab} onChange={setTab}
        />
      </div>

      <div className="p-5 space-y-4">
        {tab === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU *">
              <Input value={form.sku ?? ''} onChange={(e) => update({ sku: e.target.value })} placeholder="YW-FD-001" />
            </Field>
            <Field label="产品大类 *">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={form.category ?? ''} onChange={(e) => update({ category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== '全部').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="中文名 *"><Input value={form.name_zh ?? ''} onChange={(e) => update({ name_zh: e.target.value })} /></Field>
            <Field label="英文名 *"><Input value={form.name_en ?? ''} onChange={(e) => update({ name_en: e.target.value })} /></Field>
            <Field label="越南语名"><Input value={form.name_vi ?? ''} onChange={(e) => update({ name_vi: e.target.value })} /></Field>
            <Field label="规格"><Input value={form.spec ?? ''} onChange={(e) => update({ spec: e.target.value })} placeholder="50g/袋 * 80 袋/箱" /></Field>
            <Field label="计量单位"><Input value={form.unit ?? ''} onChange={(e) => update({ unit: e.target.value })} /></Field>
            <Field label="海关编码"><Input value={form.hs_code ?? ''} onChange={(e) => update({ hs_code: e.target.value })} placeholder="2309.10" /></Field>
          </div>
        )}

        {tab === 'price' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="出厂成本价 (USD) *">
                <Input type="number" step="0.0001" value={form.cost_price ?? 0}
                  onChange={(e) => update({ cost_price: Number(e.target.value) })} />
              </Field>
              <Field label="建议售价（利润率 35%）" hint="实时计算">
                <div className="h-10 px-3 rounded-md border border-border bg-muted/30 flex items-center text-sm font-medium">
                  ${suggested.toFixed(4)}
                </div>
              </Field>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium mb-2">阶梯价格</div>
                <p className="text-xs text-muted mb-3">同一产品可设置多个档位（散货/整柜/VIP），保存后在报价单中自动按数量匹配。</p>
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="text-left py-1.5">档位名称</th>
                      <th className="text-left py-1.5">最小数量</th>
                      <th className="text-left py-1.5">最大数量</th>
                      <th className="text-left py-1.5">直接单价</th>
                      <th className="text-left py-1.5">利润率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[['散货', 100, 999, 0.40], ['整箱', 1000, 4999, 0.35], ['VIP', 5000, '', 0.28]].map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5"><Input defaultValue={r[0] as string} /></td>
                        <td className="py-1.5"><Input type="number" defaultValue={r[1] as number} /></td>
                        <td className="py-1.5"><Input type="number" placeholder="无上限" defaultValue={r[2] as any} /></td>
                        <td className="py-1.5"><Input type="number" step="0.0001" placeholder="可选" /></td>
                        <td className="py-1.5"><Input type="number" step="0.01" defaultValue={r[3] as number} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'pack' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="每箱数量 (pcs)"><Input type="number" value={form.pcs_per_carton ?? 0} onChange={(e) => update({ pcs_per_carton: Number(e.target.value) })} /></Field>
            <Field label="每箱毛重 (kg)"><Input type="number" step="0.001" value={form.carton_gross_weight ?? 0} onChange={(e) => update({ carton_gross_weight: Number(e.target.value) })} /></Field>
            <Field label="每箱净重 (kg)"><Input type="number" step="0.001" value={form.carton_net_weight ?? 0} onChange={(e) => update({ carton_net_weight: Number(e.target.value) })} /></Field>
            <Field label="每箱体积 (CBM)"><Input type="number" step="0.000001" value={form.carton_cbm ?? 0} onChange={(e) => update({ carton_cbm: Number(e.target.value) })} /></Field>
          </div>
        )}

        {tab === 'detail' && (
          <div className="space-y-4">
            <Field label="保质期"><Input value={form.shelf_life ?? ''} onChange={(e) => update({ shelf_life: e.target.value })} placeholder="24 months" /></Field>
            <Field label="储存条件"><Input value={form.storage_condition ?? ''} onChange={(e) => update({ storage_condition: e.target.value })} placeholder="常温阴凉干燥处" /></Field>
            <Field label="配料表 (英文)"><Textarea rows={3} value={form.ingredients_en ?? ''} onChange={(e) => update({ ingredients_en: e.target.value })} /></Field>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form.is_halal} onChange={(e) => update({ is_halal: e.target.checked })} className="rounded" />
                <span>Halal 认证</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active !== false} onChange={(e) => update({ is_active: e.target.checked })} className="rounded" />
                <span>启用</span>
              </label>
            </div>
            <Field label="产品图片 URL"><Input value={form.image_url ?? ''} onChange={(e) => update({ image_url: e.target.value })} placeholder="https://..." /></Field>
          </div>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-white">
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={() => onSave(form as Product)}>保存</Button>
      </footer>
    </Drawer>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
