'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'yellow' | 'purple';

const tones: Record<Tone, string> = {
  gray:   'bg-gray-100 text-gray-700 border-gray-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({
  tone = 'gray', className, children,
}: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
      tones[tone], className,
    )}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl border border-border bg-white shadow-sm', className)}>{children}</div>;
}
export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4 border-b border-border', className)}>{children}</div>;
}
export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('text-base font-semibold', className)}>{children}</h3>;
}
export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
