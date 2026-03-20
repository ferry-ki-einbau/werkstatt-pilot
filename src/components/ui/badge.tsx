import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { JobStatus, JobPriority } from '@/types';
import { JOB_STATUS_CONFIG, PRIORITY_CONFIG } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border',
        secondary: '',
        outline: 'border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)',
        ...style,
      }}
      {...props}
    />
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const config = JOB_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: JobPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border"
      style={{
        color: config.color,
        backgroundColor: `${config.color}22`,
        borderColor: `${config.color}44`,
      }}
    >
      {config.label}
    </span>
  );
}

export { Badge, badgeVariants, StatusBadge, PriorityBadge };
