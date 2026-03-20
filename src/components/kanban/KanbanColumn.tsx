import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Job, JobStatus } from '@/types';
import { JOB_STATUS_CONFIG } from '@/types';
import { JobCard } from './JobCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: JobStatus;
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

export function KanbanColumn({ status, jobs, onJobClick }: KanbanColumnProps) {
  const config = JOB_STATUS_CONFIG[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-60 shrink-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-lg border border-b-0"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-xs font-semibold" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `${config.color}22`,
            color: config.color,
          }}
        >
          {jobs.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[400px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors',
          isOver ? 'bg-opacity-30' : ''
        )}
        style={{
          backgroundColor: isOver ? config.bgColor : 'rgba(26,26,28,0.5)',
          borderColor: isOver ? config.borderColor : 'var(--border)',
        }}
      >
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={onJobClick} />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div
            className="flex items-center justify-center h-20 rounded-lg border border-dashed text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Keine Aufträge
          </div>
        )}
      </div>
    </div>
  );
}
