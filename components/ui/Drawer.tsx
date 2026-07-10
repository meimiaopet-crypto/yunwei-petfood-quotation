'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Drawer({
  open, onClose, title, children, width = 720,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-50 transition-opacity',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        className={cn(
          'absolute top-0 right-0 h-full bg-white shadow-xl border-l border-border',
          'transform transition-transform', open ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width }}
        role="dialog"
        aria-modal
      >
        <header className="h-14 flex items-center justify-between px-5 border-b border-border">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted/40" aria-label="关闭">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}

export function Dialog({
  open, onClose, title, children, footer, maxWidth = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl shadow-xl border border-border w-full"
        style={{ maxWidth }}
      >
        <header className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{title}</h3>
        </header>
        <div className="p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-border flex justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  );
}
