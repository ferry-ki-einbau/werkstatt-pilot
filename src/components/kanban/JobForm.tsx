import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Job, JobPriority, JobStatus } from '@/types';

const jobSchema = z.object({
  title: z.string().min(2, 'Titel muss mindestens 2 Zeichen haben'),
  description: z.string().optional(),
  customer_id: z.string().min(1, 'Bitte Kunden auswählen'),
  vehicle_id: z.string().min(1, 'Bitte Fahrzeug auswählen'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['annahme', 'diagnose', 'teile_bestellt', 'teile_da', 'reparatur', 'abholbereit', 'abgeholt']),
  estimated_cost: z.string().optional(),
  estimated_ready: z.string().optional(),
  internal_notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Job, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle' | 'technician'>) => Promise<void>;
  initialStatus?: JobStatus;
  loading?: boolean;
}

export function JobForm({ open, onClose, onSubmit, initialStatus = 'annahme', loading = false }: JobFormProps) {
  const { profile } = useAuth();
  const { customers } = useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const { vehicles } = useVehicles(selectedCustomerId || undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      priority: 'normal',
      status: initialStatus,
    },
  });

  const watchedCustomerId = watch('customer_id');

  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value);
    setValue('customer_id', value);
    setValue('vehicle_id', '');
  };

  const handleClose = () => {
    reset();
    setSelectedCustomerId('');
    onClose();
  };

  const handleFormSubmit = async (data: JobFormValues) => {
    await onSubmit({
      vehicle_id: data.vehicle_id,
      customer_id: data.customer_id,
      title: data.title,
      description: data.description ?? null,
      status: data.status as JobStatus,
      priority: data.priority as JobPriority,
      estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
      actual_cost: null,
      estimated_ready: data.estimated_ready || null,
      technician_id: profile?.id ?? null,
      internal_notes: data.internal_notes ?? null,
      position: 0,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuer Auftrag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
          {/* Customer */}
          <div className="space-y-1.5">
            <Label>Kunde *</Label>
            <Select onValueChange={handleCustomerChange} value={watchedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Kunden auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && (
              <p className="text-xs" style={{ color: 'var(--destructive)' }}>
                {errors.customer_id.message}
              </p>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-1.5">
            <Label>Fahrzeug *</Label>
            <Select
              onValueChange={(v) => setValue('vehicle_id', v)}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCustomerId ? 'Fahrzeug auswählen...' : 'Erst Kunden wählen'} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.kennzeichen} {v.marke} {v.modell}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicle_id && (
              <p className="text-xs" style={{ color: 'var(--destructive)' }}>
                {errors.vehicle_id.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="z.B. Ölwechsel + Inspektion"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Detaillierte Beschreibung des Auftrags..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priorität</Label>
              <Select
                defaultValue="normal"
                onValueChange={(v) => setValue('priority', v as JobPriority)}
              >
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

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue={initialStatus}
                onValueChange={(v) => setValue('status', v as JobStatus)}
              >
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
          </div>

          {/* Cost + Ready date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="estimated_cost">Kostenvoranschlag (€)</Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('estimated_cost')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimated_ready">Fertig bis</Label>
              <Input
                id="estimated_ready"
                type="date"
                {...register('estimated_ready')}
              />
            </div>
          </div>

          {/* Internal notes */}
          <div className="space-y-1.5">
            <Label htmlFor="internal_notes">Interne Notizen</Label>
            <Textarea
              id="internal_notes"
              placeholder="Nur intern sichtbar..."
              rows={2}
              {...register('internal_notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" loading={loading}>
              <Plus className="w-4 h-4" />
              Auftrag erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
