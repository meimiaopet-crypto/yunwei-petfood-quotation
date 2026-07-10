'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Users, FileText, FileSpreadsheet, Settings,
} from 'lucide-react';

const items = [
  { href: '/dashboard',     label: '控制台',     icon: LayoutDashboard },
  { href: '/products',      label: '产品库',     icon: Package },
  { href: '/customers',     label: '客户库',     icon: Users },
  { href: '/quotations',    label: '报价单',     icon: FileText },
  { href: '/proforma-invoices', label: '形式发票 PI', icon: FileSpreadsheet },
  { href: '/settings',      label: '系统设置',   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-border flex flex-col">
      <div className="h-14 px-5 flex items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm">YW</div>
          <div>
            <div className="text-sm font-semibold leading-none">云威报价</div>
            <div className="text-[10px] text-muted mt-0.5">Quotation System</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors',
                active ? 'bg-brand text-white' : 'text-foreground/80 hover:bg-muted/40',
              )}
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-[11px] text-muted border-t border-border">
        v1.0 · Petfood Export<br/>© Yunwei Trading
      </div>
    </aside>
  );
}
