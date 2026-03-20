import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50',
            'focus:outline-none focus:ring-2',
            error ? 'border-[var(--destructive)]' : '',
            className
          )}
          style={{
            backgroundColor: 'var(--card)',
            borderColor: error ? 'var(--destructive)' : 'var(--border)',
            color: 'var(--foreground)',
            ...style,
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs" style={{ color: 'var(--destructive)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
