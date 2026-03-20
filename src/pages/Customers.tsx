import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Phone, Mail, ChevronRight } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, getTuevStatus } from '@/lib/utils';
import type { Customer, Vehicle } from '@/types';
import { toast } from 'sonner';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  phone: z.string().optional(),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  const tuev = getTuevStatus(vehicle.tuev_datum);
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
    >
      <div>
        <span className="font-mono text-sm font-bold" style={{ color: 'var(--primary)' }}>
          {vehicle.kennzeichen}
        </span>
        <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
          {[vehicle.marke, vehicle.modell, vehicle.baujahr].filter(Boolean).join(' ')}
        </span>
      </div>
      <span className="text-xs font-medium" style={{ color: tuev.color }}>
        TÜV {tuev.status === 'unknown' ? '—' : formatDate(vehicle.tuev_datum)}
      </span>
    </div>
  );
}

function CustomerDetail({
  customer,
  open,
  onClose,
}: {
  customer: Customer;
  open: boolean;
  onClose: () => void;
}) {
  const { vehicles } = useVehicles(customer.id);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {customer.phone && (
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <Phone className="w-4 h-4" />
              <a href={`tel:${customer.phone}`} style={{ color: 'var(--primary)' }}>
                {customer.phone}
              </a>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <Mail className="w-4 h-4" />
              <a href={`mailto:${customer.email}`} style={{ color: 'var(--primary)' }}>
                {customer.email}
              </a>
            </div>
          )}
          {customer.notes && (
            <p style={{ color: 'var(--muted)' }}>{customer.notes}</p>
          )}

          <div>
            <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              Fahrzeuge ({vehicles.length})
            </p>
            <div className="space-y-2">
              {vehicles.map((v) => (
                <VehicleRow key={v.id} vehicle={v} />
              ))}
              {vehicles.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Keine Fahrzeuge hinterlegt.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Customers() {
  const { customers, createCustomer, loading } = useCustomers();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: CustomerForm) => {
    setFormLoading(true);
    const { error } = await createCustomer({
      full_name: data.full_name,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    });
    setFormLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Kunde angelegt!');
    reset();
    setFormOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
          <Input
            placeholder="Kunden suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          Neuer Kunde
        </Button>
      </div>

      {/* Count */}
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        {filtered.length} {filtered.length === 1 ? 'Kunde' : 'Kunden'}
      </p>

      {/* Customer list */}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Wird geladen...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:border-[var(--primary)] transition-colors"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {customer.full_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {customer.phone && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && !loading && (
            <div
              className="text-center py-12 rounded-xl border border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <p>Keine Kunden gefunden.</p>
              <Button size="sm" className="mt-3" onClick={() => setFormOpen(true)}>
                Ersten Kunden anlegen
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New customer dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Kunde</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Name *</Label>
              <Input
                id="full_name"
                placeholder="Max Mustermann"
                error={errors.full_name?.message}
                {...register('full_name')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" placeholder="+49 711 ..." {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="kunde@email.de"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" placeholder="Interne Notizen..." rows={2} {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { reset(); setFormOpen(false); }}>
                Abbrechen
              </Button>
              <Button type="submit" loading={formLoading}>
                Kunde anlegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer detail */}
      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
