/** 简易 Table 组件（无依赖） */
'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted">{children}</thead>;
}
export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}
export function TR({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('hover:bg-muted/20', className)}>{children}</tr>;
}
export function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('text-left font-medium px-4 py-2.5', className)}>{children}</th>;
}
export function TD({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={cn('px-4 py-2.5 align-middle', className)} colSpan={colSpan}>{children}</td>;
}
