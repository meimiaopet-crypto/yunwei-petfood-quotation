'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { Save, Building2, Calculator, FileText, FolderTree, Upload } from 'lucide-react';
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [tab, setTab] = React.useState('company');
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const toast = useToast();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">系统设置</h1>
        <p className="text-sm text-muted mt-0.5">公司信息、费率、条款模板、产品大类</p>
        {mounted && !isSupabaseConfigured() && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            ⚠️ Supabase 未配置，设置仅保存在浏览器中（刷新后丢失）。请在 .env.local 配置 NEXT_PUBLIC_SUPABASE_URL 后使用真实保存。
          </div>
        )}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'company',   label: '公司信息' },
          { value: 'rates',     label: '默认费率' },
          { value: 'terms',     label: '条款模板' },
          { value: 'category',  label: '产品大类' },
        ]}
      />

      {tab === 'company' && <CompanyForm onSave={() => toast.push({ type: 'success', title: '公司信息已保存' })} />}
      {tab === 'rates' && <RatesForm onSave={() => toast.push({ type: 'success', title: '费率已保存' })} />}
      {tab === 'terms' && <TermsForm onSave={() => toast.push({ type: 'success', title: '条款已保存' })} />}
      {tab === 'category' && <CategoryForm onSave={() => toast.push({ type: 'success', title: '已保存' })} />}
    </div>
  );
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

/* =========================================================
 *  公司信息表单 —— 真正写到 company_profile
 * ========================================================= */
function CompanyForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = React.useState<any>({
    name_zh: '', name_en: '', address_zh: '', address_en: '',
    phone: '', email: '', website: '', logo_url: '', seal_url: '',
    bank_info: {} as any,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // 加载已有公司信息
  React.useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) { setLoading(false); return; }
      const sb = getBrowserSupabase();
      const { data } = await sb.from('company_profile').select('*').limit(1).single();
      if (data) setForm({
        ...data,
        bank_info: data.bank_info || {},
      });
      setLoading(false);
    })();
  }, []);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const updateBank = (k: string, v: string) =>
    setForm((f: any) => ({ ...f, bank_info: { ...(f.bank_info || {}), [k]: v } }));

  const save = async () => {
    if (!isSupabaseConfigured()) {
      onSave();
      return;
    }
    setSaving(true);
    try {
      const sb = getBrowserSupabase();
      const { data: existing } = await sb.from('company_profile').select('id').limit(1).single();
      const payload = { ...form, updated_at: new Date().toISOString() };
      if (existing?.id) {
        const { error } = await sb.from('company_profile').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('company_profile').insert(payload);
        if (error) throw error;
      }
      onSave();
    } catch (e: any) {
      alert('保存失败: ' + e?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted">加载中…</div>;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" />公司信息</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="公司中文名"><Input value={form.name_zh || ''} onChange={(e) => update('name_zh', e.target.value)} /></Field>
          <Field label="公司英文名"><Input value={form.name_en || ''} onChange={(e) => update('name_en', e.target.value)} /></Field>
          <Field label="中文地址" full><Textarea rows={2} value={form.address_zh || ''} onChange={(e) => update('address_zh', e.target.value)} /></Field>
          <Field label="英文地址" full><Textarea rows={2} value={form.address_en || ''} onChange={(e) => update('address_en', e.target.value)} /></Field>
          <Field label="电话"><Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></Field>
          <Field label="邮箱"><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></Field>
          <Field label="网址" full><Input value={form.website || ''} onChange={(e) => update('website', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>公司 Logo URL</Label>
            <Input value={form.logo_url || ''} onChange={(e) => update('logo_url', e.target.value)} placeholder="https://.../logo.png" />
            {form.logo_url && <img src={form.logo_url} alt="logo" className="h-12 mt-2 object-contain" />}
          </div>
          <div className="space-y-2">
            <Label>公司公章 URL（仅 PI 使用）</Label>
            <Input value={form.seal_url || ''} onChange={(e) => update('seal_url', e.target.value)} placeholder="https://.../seal.png" />
            {form.seal_url && <img src={form.seal_url} alt="seal" className="h-12 mt-2 object-contain" />}
          </div>
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-medium text-sm">银行账户（USD）</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Beneficiary"><Input value={form.bank_info?.beneficiary || ''} onChange={(e) => updateBank('beneficiary', e.target.value)} /></Field>
              <Field label="Bank Name"><Input value={form.bank_info?.bank_name || ''} onChange={(e) => updateBank('bank_name', e.target.value)} /></Field>
              <Field label="A/C No."><Input value={form.bank_info?.account_no || ''} onChange={(e) => updateBank('account_no', e.target.value)} /></Field>
              <Field label="SWIFT"><Input value={form.bank_info?.swift || ''} onChange={(e) => updateBank('swift', e.target.value)} /></Field>
              <Field label="Bank Address" full><Input value={form.bank_info?.bank_address || ''} onChange={(e) => updateBank('bank_address', e.target.value)} /></Field>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4" />{saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
 *  默认费率表单 —— 真正写到 rate_configs
 * ========================================================= */
function RatesForm({ onSave }: { onSave: () => void }) {
  const [rates, setRates] = React.useState<Record<string, string>>({
    default_margin_rate: '0.35', default_tax_rate: '0', default_insurance_rate: '0.003',
    default_valid_days: '30', default_lead_time: '25-30 working days after deposit received',
    exchange_usd_cny: '7.25', exchange_usd_vnd: '25000', exchange_usd_myr: '4.70',
    exchange_usd_thb: '35.50', exchange_usd_sar: '3.75', exchange_usd_aed: '3.673',
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) return;
      const sb = getBrowserSupabase();
      const { data } = await sb.from('rate_configs').select('config_key, config_value');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.config_key] = r.config_value; });
        setRates((prev) => ({ ...prev, ...map }));
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const sb = getBrowserSupabase();
        // upsert 每一项
        for (const [key, value] of Object.entries(rates)) {
          await sb.from('rate_configs').upsert(
            { config_key: key, config_value: value, updated_at: new Date().toISOString() },
            { onConflict: 'config_key' }
          );
        }
      }
      onSave();
    } catch (e: any) {
      alert('保存失败: ' + e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-4 h-4" />默认费率与汇率</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Field label="默认利润率" hint="0.35 = 35%"><Input type="number" step="0.01" value={rates.default_margin_rate || ''} onChange={(e) => setRates((r) => ({ ...r, default_margin_rate: e.target.value }))} /></Field>
          <Field label="默认税率"><Input type="number" step="0.01" value={rates.default_tax_rate || ''} onChange={(e) => setRates((r) => ({ ...r, default_tax_rate: e.target.value }))} /></Field>
          <Field label="默认保险费率"><Input type="number" step="0.001" value={rates.default_insurance_rate || ''} onChange={(e) => setRates((r) => ({ ...r, default_insurance_rate: e.target.value }))} /></Field>
          <Field label="默认有效天数"><Input type="number" value={rates.default_valid_days || ''} onChange={(e) => setRates((r) => ({ ...r, default_valid_days: e.target.value }))} /></Field>
          <Field label="默认交货期" full><Input value={rates.default_lead_time || ''} onChange={(e) => setRates((r) => ({ ...r, default_lead_time: e.target.value }))} /></Field>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">常用汇率（1 USD = ?）</div>
          <div className="grid grid-cols-3 gap-4">
            {['cny','vnd','myr','thb','sar','aed'].map((c) => (
              <Field key={c} label={`USD → ${c.toUpperCase()}`}>
                <Input type="number" step="0.0001" value={rates[`exchange_usd_${c}`] || ''}
                  onChange={(e) => setRates((r) => ({ ...r, [`exchange_usd_${c}`]: e.target.value }))} />
              </Field>
            ))}
          </div>
          <div className="text-xs text-muted mt-2">汇率每日定时从 exchangerate-api.com 拉取更新（可手动覆盖）</div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4" />{saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
 *  条款模板表单 —— 真正写到 terms_templates
 * ========================================================= */
function TermsForm({ onSave }: { onSave: () => void }) {
  const [terms, setTerms] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [newRow, setNewRow] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const sb = getBrowserSupabase();
    const { data } = await sb.from('terms_templates').select('*').order('type', { ascending: true });
    if (data) setTerms(data);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const sb = getBrowserSupabase();
        for (const t of terms) {
          if (!t.id || t.id.startsWith('new-')) {
            const { id, ...payload } = t;
            await sb.from('terms_templates').insert(payload);
          } else {
            await sb.from('terms_templates').update({
              name: t.name, type: t.type,
              content_zh: t.content_zh, content_en: t.content_en, content_vi: t.content_vi,
              is_default: t.is_default,
            }).eq('id', t.id);
          }
        }
        if (newRow) {
          await sb.from('terms_templates').insert(newRow);
          setNewRow(null);
        }
        await load();
      }
      onSave();
    } catch (e: any) {
      alert('保存失败: ' + e?.message);
    } finally {
      setSaving(false);
    }
  };

  const addNew = () => {
    setNewRow({
      name: '新条款',
      type: 'payment',
      content_zh: '', content_en: '', content_vi: '',
      is_default: false,
    });
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除该条款？')) return;
    if (isSupabaseConfigured() && !id.startsWith('new-')) {
      const sb = getBrowserSupabase();
      await sb.from('terms_templates').delete().eq('id', id);
    }
    setTerms((t) => t.filter((x: any) => x.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4" />条款模板库
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {terms.length === 0 && !newRow && (
          <div className="text-sm text-muted">暂无条款，点击"新增"添加</div>
        )}
        {terms.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="p-4 space-y-2">
              <div className="grid grid-cols-4 gap-3">
                <Field label="名称"><Input value={t.name} onChange={(e) => setTerms((arr) => arr.map((x: any) => x.id === t.id ? { ...x, name: e.target.value } : x))} /></Field>
                <Field label="类型">
                  <select className="w-full px-3 py-2 border border-border rounded-md bg-bg" value={t.type} onChange={(e) => setTerms((arr) => arr.map((x: any) => x.id === t.id ? { ...x, type: e.target.value } : x))}>
                    <option value="payment">付款条件</option>
                    <option value="delivery">交货条款</option>
                    <option value="quality">质量条款</option>
                    <option value="warranty">质保</option>
                    <option value="general">其他</option>
                  </select>
                </Field>
                <Field label="设为默认">
                  <input type="checkbox" checked={!!t.is_default} onChange={(e) => setTerms((arr) => arr.map((x: any) => x.id === t.id ? { ...x, is_default: e.target.checked } : x))} />
                </Field>
                <Field label="操作">
                  <Button variant="ghost" onClick={() => remove(t.id)}>删除</Button>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="中文内容" full><Textarea rows={2} value={t.content_zh || ''} onChange={(e) => setTerms((arr) => arr.map((x: any) => x.id === t.id ? { ...x, content_zh: e.target.value } : x))} /></Field>
                <Field label="English" full><Textarea rows={2} value={t.content_en || ''} onChange={(e) => setTerms((arr) => arr.map((x: any) => x.id === t.id ? { ...x, content_en: e.target.value } : x))} /></Field>
                <Field label="Tiếng Việt" full><Textarea rows={2} value={t.content_vi || ''} onChange={(e) => setTerms((arr) => arr.map((x: any) => x.id === t.id ? { ...x, content_vi: e.target.value } : x))} /></Field>
              </div>
            </CardContent>
          </Card>
        ))}
        {newRow && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="grid grid-cols-4 gap-3">
                <Field label="名称"><Input value={newRow.name} onChange={(e) => setNewRow({ ...newRow, name: e.target.value })} /></Field>
                <Field label="类型">
                  <select className="w-full px-3 py-2 border border-border rounded-md bg-bg" value={newRow.type} onChange={(e) => setNewRow({ ...newRow, type: e.target.value })}>
                    <option value="payment">付款条件</option>
                    <option value="delivery">交货条款</option>
                    <option value="quality">质量条款</option>
                    <option value="warranty">质保</option>
                    <option value="general">其他</option>
                  </select>
                </Field>
                <Field label="设为默认">
                  <input type="checkbox" checked={!!newRow.is_default} onChange={(e) => setNewRow({ ...newRow, is_default: e.target.checked })} />
                </Field>
                <Field label="操作">
                  <Button variant="ghost" onClick={() => setNewRow(null)}>取消</Button>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="中文内容" full><Textarea rows={2} value={newRow.content_zh} onChange={(e) => setNewRow({ ...newRow, content_zh: e.target.value })} /></Field>
                <Field label="English" full><Textarea rows={2} value={newRow.content_en} onChange={(e) => setNewRow({ ...newRow, content_en: e.target.value })} /></Field>
                <Field label="Tiếng Việt" full><Textarea rows={2} value={newRow.content_vi} onChange={(e) => setNewRow({ ...newRow, content_vi: e.target.value })} /></Field>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button variant="outline" onClick={addNew}>+ 新增条款</Button>
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4" />{saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
 *  产品大类管理 —— 真正写到 product_categories
 * ========================================================= */
function CategoryForm({ onSave }: { onSave: () => void }) {
  const [cats, setCats] = React.useState<any[]>([]);
  const [newCat, setNewCat] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const sb = getBrowserSupabase();
    const { data } = await sb.from('product_categories').select('*').order('sort_order');
    if (data) setCats(data);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const sb = getBrowserSupabase();
        for (const c of cats) {
          if (!c.id || c.id.startsWith('new-')) {
            const { id, ...payload } = c;
            await sb.from('product_categories').insert(payload);
          } else {
            await sb.from('product_categories').update({
              name_zh: c.name_zh, name_en: c.name_en,
              is_active: c.is_active, sort_order: c.sort_order,
            }).eq('id', c.id);
          }
        }
        if (newCat) {
          await sb.from('product_categories').insert(newCat);
          setNewCat(null);
        }
        await load();
      }
      onSave();
    } catch (e: any) {
      alert('保存失败: ' + e?.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除该大类？')) return;
    if (isSupabaseConfigured() && !id.startsWith('new-')) {
      const sb = getBrowserSupabase();
      await sb.from('product_categories').delete().eq('id', id);
    }
    setCats((arr) => arr.filter((x) => x.id !== id));
  };

  const addNew = () => {
    setNewCat({
      name_zh: '新分类', name_en: 'New Category',
      is_active: true, sort_order: (cats.length + 1) * 10,
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FolderTree className="w-4 h-4" />产品大类</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {cats.length === 0 && !newCat && <div className="text-sm text-muted">暂无大类</div>}
        {cats.map((c) => (
          <div key={c.id} className="grid grid-cols-5 gap-3 items-end p-3 border border-border rounded-md">
            <Field label="中文名"><Input value={c.name_zh || ''} onChange={(e) => setCats((arr) => arr.map((x) => x.id === c.id ? { ...x, name_zh: e.target.value } : x))} /></Field>
            <Field label="English"><Input value={c.name_en || ''} onChange={(e) => setCats((arr) => arr.map((x) => x.id === c.id ? { ...x, name_en: e.target.value } : x))} /></Field>
            <Field label="排序"><Input type="number" value={c.sort_order ?? 0} onChange={(e) => setCats((arr) => arr.map((x) => x.id === c.id ? { ...x, sort_order: Number(e.target.value) } : x))} /></Field>
            <Field label="启用">
              <input type="checkbox" checked={!!c.is_active} onChange={(e) => setCats((arr) => arr.map((x) => x.id === c.id ? { ...x, is_active: e.target.checked } : x))} />
            </Field>
            <Button variant="ghost" onClick={() => remove(c.id)}>删除</Button>
          </div>
        ))}
        {newCat && (
          <div className="grid grid-cols-5 gap-3 items-end p-3 border border-dashed border-border rounded-md bg-muted/30">
            <Field label="中文名"><Input value={newCat.name_zh} onChange={(e) => setNewCat({ ...newCat, name_zh: e.target.value })} /></Field>
            <Field label="English"><Input value={newCat.name_en} onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })} /></Field>
            <Field label="排序"><Input type="number" value={newCat.sort_order} onChange={(e) => setNewCat({ ...newCat, sort_order: Number(e.target.value) })} /></Field>
            <Field label="启用">
              <input type="checkbox" checked={!!newCat.is_active} onChange={(e) => setNewCat({ ...newCat, is_active: e.target.checked })} />
            </Field>
            <Button variant="ghost" onClick={() => setNewCat(null)}>取消</Button>
          </div>
        )}
        <div className="flex justify-between">
          <Button variant="outline" onClick={addNew}>+ 新增大类</Button>
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4" />{saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
