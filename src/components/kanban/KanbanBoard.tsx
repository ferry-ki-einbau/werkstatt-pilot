import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { Job, JobStatus } from '@/types';
import { JOB_STATUS_ORDER } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { JobCardOverlay } from './JobCard';
import { JobForm } from './JobForm';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { notifyStatusChange } from '@/lib/notifications';
import { toast } from 'sonner';

// Job detail dialog
import { JobDetailDialog } from './JobDetailDialog';

export function KanbanBoard() {
  const { jobs, createJob, updateJobStatus, loading } = useJobs();
  const { tenant } = useAuth();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const job = jobs.find((j) => j.id === event.active.id);
    if (job) setActiveJob(job);
  }, [jobs]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveJob(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const job = jobs.find((j) => j.id === active.id);
      if (!job) return;

      // over.id could be a column status or another job's id
      let newStatus: JobStatus | null = null;

      // Check if dropped on a column
      if (JOB_STATUS_ORDER.includes(over.id as JobStatus)) {
        newStatus = over.id as JobStatus;
      } else {
        // Dropped on another job — find its column
        const targetJob = jobs.find((j) => j.id === over.id);
        if (targetJob && targetJob.status !== job.status) {
          newStatus = targetJob.status;
        }
      }

      if (!newStatus || newStatus === job.status) return;

      const { error } = await updateJobStatus(job.id, newStatus);
      if (error) {
        toast.error(error);
        return;
      }

      // Send notification
      if (job.customer && job.vehicle && tenant) {
        await notifyStatusChange({
          jobId: job.id,
          newStatus,
          customerPhone: job.customer.phone,
          customerEmail: job.customer.email,
          customerName: job.customer.full_name,
          kennzeichen: job.vehicle.kennzeichen,
          werkstattName: tenant.name,
          tenantGoogleReviewUrl: tenant.google_review_url,
        });
      }

      toast.success(`Auftrag verschoben: ${job.vehicle?.kennzeichen} → Abschnitt geändert`);
    },
    [jobs, updateJobStatus, tenant]
  );

  const handleCreateJob = useCallback(
    async (
      data: Omit<Job, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle' | 'technician'>
    ) => {
      setFormLoading(true);
      const { error } = await createJob(data);
      setFormLoading(false);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success('Auftrag erstellt!');
    },
    [createJob]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {jobs.filter((j) => j.status !== 'abgeholt').length} offene Aufträge
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          Neuer Auftrag
        </Button>
      </div>

      {/* Kanban columns — horizontal scroll */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 min-w-max">
            {JOB_STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                jobs={jobs.filter((j) => j.status === status)}
                onJobClick={(job) => setSelectedJob(job)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeJob ? <JobCardOverlay job={activeJob} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          Aufträge werden geladen...
        </div>
      )}

      {/* New job form */}
      <JobForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateJob}
        loading={formLoading}
      />

      {/* Job detail dialog */}
      {selectedJob && (
        <JobDetailDialog
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
