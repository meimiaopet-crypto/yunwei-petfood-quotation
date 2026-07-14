'use client';
import { Search, Bell, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 px-6 bg-white border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>工作台</span>
        <span>·</span>
        <span>邢台云伟进出口有限公司</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-md hover:bg-muted/40" title="通知"><Bell className="w-4 h-4 text-muted" /></button>
        <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/40 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-medium">A</div>
          <span className="text-sm">Admin</span>
          <User className="w-3.5 h-3.5 text-muted" />
        </div>
      </div>
    </header>
  );
}
