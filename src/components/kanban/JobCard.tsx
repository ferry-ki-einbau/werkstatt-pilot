import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, AlertCircle } from 'lucide-react';
import type { Job } from '@/types';
import { PRIORITY_CONFIG, JOB_STATUS_CONFIG } from '@/types';
import { formatDate, formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityConfig = PRIORITY_CONFIG[job.priority];
  const isUrgent = job.priority === 'urgent' || job.priority === 'high';

  const isOverdue =
    job.estimated_ready &&
    new Date(job.estimated_ready) < new Date() &&
    job.status !== 'abgeholt';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--card)',
        borderColor: isOverdue ? 'rgba(239,68,68,0.5)' : 'var(--border)',
      }}
      className={cn(
        'rounded-lg border p-3 cursor-pointer select-none',
        'hover:border-[var(--primary)] transition-colors shadow-sm',
        isDragging ? 'shadow-xl ring-2 ring-[var(--primary)]' : ''
      )}
      onClick={() => onClick(job)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-[var(--card-hover)] touch-none"
            style={{ color: 'var(--muted)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Kennzeichen — prominent */}
          <span
            className="font-mono font-bold text-sm truncate"
            style={{ color: 'var(--primary)' }}
          >
            {job.vehicle?.kennzeichen ?? '—'}
          </span>
        </div>

        {/* Priority indicator */}
        {isUrgent && (
          <AlertCircle
            className="w-4 h-4 shrink-0"
            style={{ color: priorityConfig.color }}
          />
        )}
      </div>

      {/* Customer name */}
      <p className="text-sm font-medium truncate mb-1" style={{ color: 'var(--foreground)' }}>
        {job.customer?.full_name ?? '—'}
      </p>

      {/* Job title */}
      <p className="text-xs truncate mb-2" style={{ color: 'var(--muted)' }}>
        {job.title}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2">
        {/* Priority badge */}
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            color: priorityConfig.color,
            backgroundColor: `${priorityConfig.color}22`,
          }}
        >
          {priorityConfig.label}
        </span>

        {/* Time info */}
        <div className="flex items-center gap-1" style={{ color: isOverdue ? '#ef4444' : 'var(--muted)' }}>
          <Clock className="w-3 h-3 shrink-0" />
          <span className="text-[10px]">
            {job.estimated_ready
              ? formatDate(job.estimated_ready)
              : formatRelative(job.created_at)}
          </span>
        </div>
      </div>

      {/* Vehicle info */}
      {(job.vehicle?.marke || job.vehicle?.modell) && (
        <p className="text-[10px] mt-1.5 truncate" style={{ color: 'var(--muted)' }}>
          {[job.vehicle.marke, job.vehicle.modell, job.vehicle.baujahr].filter(Boolean).join(' ')}
        </p>
      )}
    </div>
  );
}

// Overlay version (shown while dragging)
export function JobCardOverlay({ job }: { job: Job }) {
  const statusConfig = JOB_STATUS_CONFIG[job.status];
  return (
    <div
      className="rounded-lg border p-3 shadow-2xl rotate-2 w-56"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: statusConfig.borderColor,
      }}
    >
      <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
        {job.vehicle?.kennzeichen ?? '—'}
      </span>
      <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted)' }}>
        {job.title}
      </p>
    </div>
  );
}
