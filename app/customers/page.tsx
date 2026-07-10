'use client';
import * as React from 'react';
import { data } from '@/lib/supabase/data';
import { Card, CardContent, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit2, Search, Users as UsersIcon } from 'lucide-react';
import type { Customer } from '@/types';
import { formatMoney } from '@/lib/i18n/outputTranslations';

const COUNTRIES = ['全部', 'VN', 'MY', 'TH', 'SA', 'AE', 'ID', 'PH'];
const LEVELS = ['全部', '普通客户', '老客户', 'VIP代理', '战略合作'];

const levelTone: Record<string, 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'yellow' | 'purple'> = {
  '普通客户': 'gray', '老客户': 'blue', 'VIP代理': 'purple', '战略合作': 'green',
};

const countryFlag: Record<string, string> = {
  VN: '🇻🇳', MY: '🇲🇾', TH: '🇹🇭', SA: '🇸🇦', AE: '🇦🇪', ID: '🇮🇩', PH: '🇵🇭',
};

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [country, setCountry] = React.useState('全部');
  const [level, setLevel] = React.useState('全部');
  const [kw, setKw] = React.useState('');
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setCustomers(await data.customers.list());
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    if (country !== '全部' && c.country !== country) return false;
    if (level !== '全部' && c.customer_level !== level) return false;
    if (kw && !`${c.company_name} ${c.customer_code} ${c.contact_person ?? ''}`.toLowerCase().includes(kw.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (c: Customer) => {
    await data.customers.upsert(c);
    toast.push({ type: 'success', title: '已保存', description: c.company_name });
    setOpen(false); setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">客户库</h1>
          <p className="text-sm text-muted mt-0.5">共 {customers.length} 个客户，覆盖 {new Set(customers.map((c) => c.country)).size} 个国家</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="w-4 h-4" />新增客户</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Tabs items={COUNTRIES.map((c) => ({ value: c, label: c === '全部' ? '全部国家' : `${countryFlag[c] ?? ''} ${c}` }))}
            value={country} onChange={setCountry} />
          <Tabs items={LEVELS.map((l) => ({ value: l, label: l }))} value={level} onChange={setLevel} />
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input className="pl-8 w-64" placeholder="搜索公司名 / 编码" value={kw} onChange={(e) => setKw(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">编码</th>
                <th className="text-left px-4 py-2.5 font-medium">公司名称</th>
                <th className="text-left px-4 py-2.5 font-medium">国家</th>
                <th className="text-left px-4 py-2.5 font-medium">联系人</th>
                <th className="text-left px-4 py-2.5 font-medium">等级</th>
                <th className="text-left px-4 py-2.5 font-medium">结算</th>
                <th className="text-left px-4 py-2.5 font-medium">付款条件</th>
                <th className="text-right px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-xs">{c.customer_code}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{c.company_name}</div>
                    <div className="text-xs text-muted">{c.city ?? '-'}</div>
                  </td>
                  <td className="px-4 py-2.5">{countryFlag[c.country] ?? ''} {c.country}</td>
                  <td className="px-4 py-2.5">
                    <div>{c.contact_person ?? '-'}</div>
                    <div className="text-xs text-muted">{c.whatsapp ?? c.email ?? ''}</div>
                  </td>
                  <td className="px-4 py-2.5"><Badge tone={levelTone[c.customer_level] ?? 'gray'}>{c.customer_level}</Badge></td>
                  <td className="px-4 py-2.5 text-muted">{c.currency} · {c.incoterms}</td>
                  <td className="px-4 py-2.5 text-xs text-muted max-w-xs truncate">{c.payment_terms}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="p-1.5 rounded hover:bg-muted/40" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">
                  <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />暂无客户
                </td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <CustomerEditor
        open={open}
        customer={editing}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

function CustomerEditor({
  open, customer, onClose, onSave,
}: {
  open: boolean; customer: Customer | null;
  onClose: () => void; onSave: (c: Customer) => void;
}) {
  const [tab, setTab] = React.useState('basic');
  const [form, setForm] = React.useState<Partial<Customer>>({});
  React.useEffect(() => {
    setForm(customer ?? {
      customer_code: '', company_name: '', country: 'VN',
      currency: 'USD', language: 'en',
      payment_terms: 'T/T 30% deposit, 70% before shipment',
      incoterms: 'FOB', customer_level: '普通客户', default_discount: 0, is_active: true,
    });
  }, [customer, open]);

  const update = (patch: Partial<Customer>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Drawer open={open} onClose={onClose} title={customer ? '编辑客户' : '新增客户'} width={760}>
      <div className="px-5 py-4 border-b border-border">
        <Tabs
          items={[
            { value: 'basic', label: '基本信息' },
            { value: 'trade', label: '贸易偏好' },
            { value: 'history', label: '历史记录' },
          ]}
          value={tab} onChange={setTab}
        />
      </div>

      <div className="p-5 space-y-4">
        {tab === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="客户编码 *"><Input value={form.customer_code ?? ''} onChange={(e) => update({ customer_code: e.target.value })} placeholder="VN-001" /></Field>
            <Field label="国家 *">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={form.country ?? 'VN'} onChange={(e) => update({ country: e.target.value })}>
                {['VN','MY','TH','SA','AE','ID','PH','JP','KR','SG'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="公司名称 *" full><Input value={form.company_name ?? ''} onChange={(e) => update({ company_name: e.target.value })} /></Field>
            <Field label="联系人"><Input value={form.contact_person ?? ''} onChange={(e) => update({ contact_person: e.target.value })} /></Field>
            <Field label="电话"><Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} /></Field>
            <Field label="WhatsApp"><Input value={form.whatsapp ?? ''} onChange={(e) => update({ whatsapp: e.target.value })} /></Field>
            <Field label="邮箱"><Input type="email" value={form.email ?? ''} onChange={(e) => update({ email: e.target.value })} /></Field>
            <Field label="城市"><Input value={form.city ?? ''} onChange={(e) => update({ city: e.target.value })} /></Field>
            <Field label="地址" full><Textarea rows={2} value={form.address ?? ''} onChange={(e) => update({ address: e.target.value })} /></Field>
            <Field label="税号"><Input value={form.tax_id ?? ''} onChange={(e) => update({ tax_id: e.target.value })} /></Field>
          </div>
        )}

        {tab === 'trade' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="结算货币">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={form.currency ?? 'USD'} onChange={(e) => update({ currency: e.target.value as any })}>
                {['USD','CNY','VND','MYR','THB','SAR','AED'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="报价语言偏好">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={form.language ?? 'en'} onChange={(e) => update({ language: e.target.value as any })}>
                <option value="zh">中文</option><option value="en">English</option><option value="vi">Tiếng Việt</option>
              </select>
            </Field>
            <Field label="付款条件" full>
              <Textarea rows={2} value={form.payment_terms ?? ''} onChange={(e) => update({ payment_terms: e.target.value })} />
            </Field>
            <Field label="贸易条款">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={form.incoterms ?? 'FOB'} onChange={(e) => update({ incoterms: e.target.value as any })}>
                {['FOB','CIF','CFR','EXW'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="客户等级">
              <select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={form.customer_level ?? '普通客户'} onChange={(e) => update({ customer_level: e.target.value })}>
                {['普通客户','老客户','VIP代理','战略合作'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="默认折扣" hint="0.05 = 95 折">
              <Input type="number" step="0.01" min="0" max="1" value={form.default_discount ?? 0}
                onChange={(e) => update({ default_discount: Number(e.target.value) })} />
            </Field>
            <Field label="备注" full>
              <Textarea rows={2} value={form.notes ?? ''} onChange={(e) => update({ notes: e.target.value })} />
            </Field>
          </div>
        )}

        {tab === 'history' && (
          <div className="py-8 text-center text-muted text-sm">
            历史报价单功能将在 Phase 3 接入
          </div>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-white">
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={() => onSave(form as Customer)}>保存</Button>
      </footer>
    </Drawer>
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
