'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'warning' | 'error' | 'info';
type Toast = { id: number; type: ToastType; title: string; description?: string };

const ToastContext = React.createContext<{
  push: (t: Omit<Toast, 'id'>) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, ...t }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismiss = (id: number) => setToasts((cur) => cur.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'warning' ? AlertTriangle : t.type === 'error' ? XCircle : Info;
          const tone = t.type === 'success' ? 'border-green-200 bg-green-50 text-green-800'
            : t.type === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
            : t.type === 'error' ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-blue-200 bg-blue-50 text-blue-800';
          return (
            <div key={t.id} className={cn('flex items-start gap-3 p-3 rounded-lg border shadow-sm bg-white', tone)}>
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.title}</div>
                {t.description && <div className="text-xs opacity-80 mt-0.5">{t.description}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
