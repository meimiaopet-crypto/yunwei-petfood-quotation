'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem { value: string; label: string; }

export function Tabs({
  items, value, onChange, className,
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            'px-3 h-8 rounded-md text-sm font-medium transition-colors',
            value === it.value
              ? 'bg-white text-brand shadow-sm'
              : 'text-muted hover:text-foreground',
          )}
        >{it.label}</button>
      ))}
    </div>
  );
}
