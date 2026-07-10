'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { Save, Building2, Calculator, FileText, FolderTree, Upload } from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();
  const [tab, setTab] = React.useState('company');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">系统设置</h1>
        <p className="text-sm text-muted mt-0.5">公司信息、费率、条款模板、产品大类</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs
            items={[
              { value: 'company',   label: '公司信息' },
              { value: 'rates',     label: '默认费率' },
              { value: 'terms',     label: '条款模板' },
              { value: 'category',  label: '产品大类' },
            ]}
            value={tab} onChange={setTab}
          />
        </CardContent>
      </Card>

      {tab === 'company' && <CompanyForm onSave={() => toast.push({ type: 'success', title: '公司信息已保存' })} />}
      {tab === 'rates'   && <RatesForm   onSave={() => toast.push({ type: 'success', title: '费率已保存' })} />}
      {tab === 'terms'   && <TermsForm   onSave={() => toast.push({ type: 'success', title: '条款已保存' })} />}
      {tab === 'category'&& <CategoryForm onSave={() => toast.push({ type: 'success', title: '已保存' })} />}
    </div>
  );
}

function CompanyForm({ onSave }: { onSave: () => void }) {
  const [form, setForm] = React.useState({
    name_zh: '邢台云威进出口有限公司',
    name_en: 'Xingtai Yunwei Import and Export Co., Ltd.',
    address_zh: '河北省邢台市桥西区中兴西大街 188 号',
    address_en: 'No.188 Zhongxing West Street, Qiaoxi District, Xingtai City, Hebei, China',
    phone: '+86-319-8888-6666',
    email: 'sales@xtyunwei.com',
    website: 'https://www.xtyunwei.com',
  });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" />公司信息</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="公司中文名"><Input value={form.name_zh} onChange={(e) => update('name_zh', e.target.value)} /></Field>
          <Field label="公司英文名"><Input value={form.name_en} onChange={(e) => update('name_en', e.target.value)} /></Field>
          <Field label="中文地址" full><Textarea rows={2} value={form.address_zh} onChange={(e) => update('address_zh', e.target.value)} /></Field>
          <Field label="英文地址" full><Textarea rows={2} value={form.address_en} onChange={(e) => update('address_en', e.target.value)} /></Field>
          <Field label="电话"><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
          <Field label="邮箱"><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field>
          <Field label="网址" full><Input value={form.website} onChange={(e) => update('website', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>公司 Logo</Label>
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center text-sm text-muted cursor-pointer hover:bg-muted/30">
              <Upload className="w-6 h-6 mx-auto mb-2" />点击上传 / 拖拽图片到此处
              <div className="text-xs mt-1">PNG / SVG，建议 200x200</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>公司公章</Label>
            <div className="border-2 border-dashed border-border rounded-md p-6 text-center text-sm text-muted cursor-pointer hover:bg-muted/30">
              <Upload className="w-6 h-6 mx-auto mb-2" />点击上传公章（仅 PI 使用）
              <div className="text-xs mt-1">PNG 透明背景，建议 300x300</div>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-medium text-sm">银行账户（USD）</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Beneficiary"><Input defaultValue="Xingtai Yunwei Import and Export Co., Ltd." /></Field>
              <Field label="Bank Name"><Input defaultValue="Bank of China, Hebei Branch" /></Field>
              <Field label="A/C No."><Input defaultValue="USD-1008-8888-9999-0001" /></Field>
              <Field label="SWIFT"><Input defaultValue="BKCHCNBJ45A" /></Field>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end"><Button onClick={onSave}><Save className="w-4 h-4" />保存</Button></div>
      </CardContent>
    </Card>
  );
}

function RatesForm({ onSave }: { onSave: () => void }) {
  const [rates, setRates] = React.useState<Record<string, string>>({
    default_margin_rate: '0.35', default_tax_rate: '0', default_insurance_rate: '0.003',
    default_valid_days: '30', default_lead_time: '25-30 working days after deposit received',
    exchange_usd_cny: '7.25', exchange_usd_vnd: '25000', exchange_usd_myr: '4.70',
    exchange_usd_thb: '35.50', exchange_usd_sar: '3.75', exchange_usd_aed: '3.673',
  });
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="w-4 h-4" />默认费率与汇率</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Field label="默认利润率" hint="0.35 = 35%"><Input type="number" step="0.01" value={rates.default_margin_rate} onChange={(e) => setRates((r) => ({ ...r, default_margin_rate: e.target.value }))} /></Field>
          <Field label="默认税率"><Input type="number" step="0.01" value={rates.default_tax_rate} onChange={(e) => setRates((r) => ({ ...r, default_tax_rate: e.target.value }))} /></Field>
          <Field label="默认保险费率"><Input type="number" step="0.001" value={rates.default_insurance_rate} onChange={(e) => setRates((r) => ({ ...r, default_insurance_rate: e.target.value }))} /></Field>
          <Field label="默认有效天数"><Input type="number" value={rates.default_valid_days} onChange={(e) => setRates((r) => ({ ...r, default_valid_days: e.target.value }))} /></Field>
          <Field label="默认交货期" full><Input value={rates.default_lead_time} onChange={(e) => setRates((r) => ({ ...r, default_lead_time: e.target.value }))} /></Field>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">常用汇率（1 USD = ?）</div>
          <div className="grid grid-cols-3 gap-4">
            {['cny','vnd','myr','thb','sar','aed'].map((c) => (
              <Field key={c} label={`USD → ${c.toUpperCase()}`}>
                <Input type="number" step="0.0001" value={rates[`exchange_usd_${c}`] ?? ''}
                  onChange={(e) => setRates((r) => ({ ...r, [`exchange_usd_${c}`]: e.target.value }))} />
              </Field>
            ))}
          </div>
          <div className="text-xs text-muted mt-2">汇率每日定时从 exchangerate-api.com 拉取更新（可手动覆盖）</div>
        </div>
        <div className="flex justify-end"><Button onClick={onSave}><Save className="w-4 h-4" />保存</Button></div>
      </CardContent>
    </Card>
  );
}

function TermsForm({ onSave }: { onSave: () => void }) {
  const [terms, setTerms] = React.useState([
    { id: '1', name: '30/70 定金', type: 'payment', zh: 'T/T 30% 定金，70% 见提单副本后付清', en: 'T/T 30% deposit, 70% balance against copy of B/L', vi: 'T/T 30% đặt cọc, 70% còn lại khi nhận bản sao B/L', isDefault: true },
    { id: '2', name: '即期信用证', type: 'payment', zh: '不可撤销即期信用证', en: 'Irrevocable L/C at sight', vi: 'Thư tín dụng không thể hủy ngang trả ngay', isDefault: false },
    { id: '3', name: '25-30 工作日交货', type: 'delivery', zh: '收到定金后 25-30 个工作日内交货', en: '25-30 working days after deposit received', vi: '25-30 ngày làm việc sau khi nhận đặt cọc', isDefault: true },
    { id: '4', name: '质量保证', type: 'quality', zh: '保质期内出现质量问题，我司免费补发或退款', en: 'Any quality issue within shelf life, we will resend or refund', vi: 'Nếu có vấn đề chất lượng, chúng tôi sẽ gửi bù hoặc hoàn tiền', isDefault: true },
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><FileText className="w-4 h-4" />条款模板库</span>
          <Button size="sm">+新增条款</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">名称</th>
              <th className="text-left px-4 py-2.5 font-medium">类型</th>
              <th className="text-left px-4 py-2.5 font-medium">中文</th>
              <th className="text-left px-4 py-2.5 font-medium">英文</th>
              <th className="text-left px-4 py-2.5 font-medium">越南语</th>
              <th className="text-center px-4 py-2.5 font-medium">默认</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {terms.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5 font-medium">{t.name}</td>
                <td className="px-4 py-2.5 text-muted text-xs">{t.type}</td>
                <td className="px-4 py-2.5 text-xs max-w-xs truncate">{t.zh}</td>
                <td className="px-4 py-2.5 text-xs max-w-xs truncate">{t.en}</td>
                <td className="px-4 py-2.5 text-xs max-w-xs truncate">{t.vi}</td>
                <td className="px-4 py-2.5 text-center">{t.isDefault ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 flex justify-end border-t border-border"><Button onClick={onSave}><Save className="w-4 h-4" />保存</Button></div>
      </CardContent>
    </Card>
  );
}

function CategoryForm({ onSave }: { onSave: () => void }) {
  const [cats, setCats] = React.useState([
    { id: '1', zh: '冻干零食', en: 'Freeze-Dried Treats', order: 1, active: true },
    { id: '2', zh: '猫条/湿粮', en: 'Cat Pouches / Wet Food', order: 2, active: true },
    { id: '3', zh: '猫主粮', en: 'Cat Dry Food', order: 3, active: true },
    { id: '4', zh: '狗主粮', en: 'Dog Dry Food', order: 4, active: true },
    { id: '5', zh: '罐头', en: 'Canned Food', order: 5, active: true },
    { id: '6', zh: '咬胶', en: 'Dog Chews', order: 6, active: true },
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><FolderTree className="w-4 h-4" />产品大类</span>
          <Button size="sm">+新增分类</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium w-16">排序</th>
              <th className="text-left px-4 py-2.5 font-medium">中文名</th>
              <th className="text-left px-4 py-2.5 font-medium">英文名</th>
              <th className="text-center px-4 py-2.5 font-medium">启用</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cats.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5"><Input type="number" className="h-8 w-16" value={c.order} onChange={() => {}} /></td>
                <td className="px-4 py-2.5"><Input value={c.zh} onChange={() => {}} /></td>
                <td className="px-4 py-2.5"><Input value={c.en} onChange={() => {}} /></td>
                <td className="px-4 py-2.5 text-center"><input type="checkbox" defaultChecked={c.active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 flex justify-end border-t border-border"><Button onClick={onSave}><Save className="w-4 h-4" />保存</Button></div>
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'col-span-3 space-y-1.5' : 'space-y-1.5'}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
