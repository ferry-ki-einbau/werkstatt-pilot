import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'placeholder:text-[var(--muted)] focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
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
Textarea.displayName = 'Textarea';

export { Textarea };
