'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  default: 'bg-brand text-white hover:bg-brand-700',
  primary: 'bg-brand text-white hover:bg-brand-700',
  success: 'bg-success text-white hover:opacity-90',
  warning: 'bg-warning text-white hover:opacity-90',
  danger:  'bg-danger text-white hover:opacity-90',
  ghost:   'bg-transparent text-foreground hover:bg-muted/40',
  outline: 'border border-border bg-white hover:bg-muted/30 text-foreground',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-md',
  lg: 'h-11 px-6 text-base rounded-md',
  icon: 'h-9 w-9 rounded-md',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
