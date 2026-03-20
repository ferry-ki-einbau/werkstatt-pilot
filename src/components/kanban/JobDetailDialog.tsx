import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';
import type { Job, JobStatus, JobPriority } from '@/types';
import { formatDate, formatCurrency, formatDatetime } from '@/lib/utils';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { notifyStatusChange } from '@/lib/notifications';
import { toast } from 'sonner';
import { Car, User, Calendar, DollarSign, Trash2 } from 'lucide-react';

interface JobDetailDialogProps {
  job: Job;
  open: boolean;
  onClose: () => void;
}

export function JobDetailDialog({ job, open, onClose }: JobDetailDialogProps) {
  const { updateJob, updateJobStatus, deleteJob } = useJobs();
  const { tenant } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [internalNotes, setInternalNotes] = useState(job.internal_notes ?? '');
  const [actualCost, setActualCost] = useState(job.actual_cost?.toString() ?? '');

  const handleStatusChange = async (newStatus: JobStatus) => {
    setSaving(true);
    const { error } = await updateJobStatus(job.id, newStatus);
    setSaving(false);
    if (error) {
      toast.error(error);
      return;
    }

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

    toast.success('Status aktualisiert.');
    onClose();
  };

  const handlePriorityChange = async (priority: JobPriority) => {
    await updateJob(job.id, { priority });
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    const { error } = await updateJob(job.id, {
      internal_notes: internalNotes,
      actual_cost: actualCost ? parseFloat(actualCost) : null,
    });
    setSaving(false);
    if (error) toast.error(error);
    else toast.success('Gespeichert.');
  };

  const handleDelete = async () => {
    if (!confirm('Auftrag wirklich löschen?')) return;
    setDeleting(true);
    const { error } = await deleteJob(job.id);
    setDeleting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Auftrag gelöscht.');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono" style={{ color: 'var(--primary)' }}>
              {job.vehicle?.kennzeichen ?? '—'}
            </span>
            <StatusBadge status={job.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Job title */}
          <p className="font-medium text-base" style={{ color: 'var(--foreground)' }}>
            {job.title}
          </p>
          {job.description && (
            <p style={{ color: 'var(--muted)' }}>{job.description}</p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <User className="w-4 h-4 shrink-0" />
              <span>{job.customer?.full_name ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <Car className="w-4 h-4 shrink-0" />
              <span>
                {[job.vehicle?.marke, job.vehicle?.modell].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Fertig bis: {formatDate(job.estimated_ready)}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>KVA: {formatCurrency(job.estimated_cost)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge priority={job.priority} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Erstellt: {formatDatetime(job.created_at)}
            </span>
          </div>

          {/* Status change */}
          <div className="space-y-1.5">
            <Label>Status ändern</Label>
            <Select defaultValue={job.status} onValueChange={(v) => handleStatusChange(v as JobStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annahme">Annahme</SelectItem>
                <SelectItem value="diagnose">Diagnose</SelectItem>
                <SelectItem value="teile_bestellt">Teile bestellt</SelectItem>
                <SelectItem value="teile_da">Teile da</SelectItem>
                <SelectItem value="reparatur">In Reparatur</SelectItem>
                <SelectItem value="abholbereit">Abholbereit</SelectItem>
                <SelectItem value="abgeholt">Abgeholt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority change */}
          <div className="space-y-1.5">
            <Label>Priorität</Label>
            <Select defaultValue={job.priority} onValueChange={(v) => handlePriorityChange(v as JobPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actual cost */}
          <div className="space-y-1.5">
            <Label htmlFor="actual_cost">Tatsächliche Kosten (€)</Label>
            <Input
              id="actual_cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
            />
          </div>

          {/* Internal notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Interne Notizen</Label>
            <Textarea
              id="notes"
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Nur intern sichtbar..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </Button>
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button onClick={handleSaveNotes} loading={saving}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
