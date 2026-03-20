import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Car, AlertTriangle } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getTuevStatus } from '@/lib/utils';
import type { Vehicle } from '@/types';
import { toast } from 'sonner';

const vehicleSchema = z.object({
  kennzeichen: z.string().min(2, 'Kennzeichen eingeben'),
  customer_id: z.string().min(1, 'Bitte Kunden auswählen'),
  marke: z.string().optional(),
  modell: z.string().optional(),
  baujahr: z.string().optional(),
  vin: z.string().optional(),
  tuev_datum: z.string().optional(),
  letzte_inspektion: z.string().optional(),
  letzter_km_stand: z.string().optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

type TuevFilter = 'all' | 'warning' | 'expired';

export function Vehicles() {
  const { vehicles, createVehicle, loading } = useVehicles();
  const { customers } = useCustomers();
  const [search, setSearch] = useState('');
  const [tuevFilter, setTuevFilter] = useState<TuevFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VehicleForm>({ resolver: zodResolver(vehicleSchema) });

  const filtered = vehicles.filter((v) => {
    const matchSearch =
      v.kennzeichen.toLowerCase().includes(search.toLowerCase()) ||
      v.marke?.toLowerCase().includes(search.toLowerCase()) ||
      v.modell?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (tuevFilter === 'all') return true;
    const tuev = getTuevStatus(v.tuev_datum);
    if (tuevFilter === 'warning') return tuev.status === 'warning';
    if (tuevFilter === 'expired') return tuev.status === 'expired';
    return true;
  });

  const tuevWarningCount = vehicles.filter((v) => {
    const s = getTuevStatus(v.tuev_datum);
    return s.status === 'warning' || s.status === 'expired';
  }).length;

  const onSubmit = async (data: VehicleForm) => {
    setFormLoading(true);
    const { error } = await createVehicle({
      customer_id: data.customer_id,
      kennzeichen: data.kennzeichen.toUpperCase(),
      marke: data.marke || null,
      modell: data.modell || null,
      baujahr: data.baujahr ? parseInt(data.baujahr) : null,
      vin: data.vin || null,
      tuev_datum: data.tuev_datum || null,
      letzte_inspektion: data.letzte_inspektion || null,
      letzter_km_stand: data.letzter_km_stand ? parseInt(data.letzter_km_stand) : null,
    });
    setFormLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Fahrzeug angelegt!');
    reset();
    setFormOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* TÜV warning banner */}
      {tuevWarningCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: 'rgba(249,115,22,0.1)',
            borderColor: 'rgba(249,115,22,0.4)',
          }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#f97316' }} />
          <p className="text-sm" style={{ color: '#f97316' }}>
            <strong>{tuevWarningCount} Fahrzeug{tuevWarningCount > 1 ? 'e' : ''}</strong> mit
            TÜV-Warnung oder abgelaufenem TÜV.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTuevFilter(tuevFilter === 'all' ? 'warning' : 'all')}
            style={{ color: '#f97316', marginLeft: 'auto' }}
          >
            {tuevFilter === 'all' ? 'Filtern' : 'Alle anzeigen'}
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--muted)' }}
          />
          <Input
            placeholder="Kennzeichen, Marke, Modell..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          Fahrzeug
        </Button>
      </div>

      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        {filtered.length} {filtered.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}
      </p>

      {/* Vehicle list */}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Wird geladen...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} customers={customers} />
          ))}
          {filtered.length === 0 && !loading && (
            <div
              className="col-span-full text-center py-12 rounded-xl border border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Keine Fahrzeuge gefunden.</p>
              <Button size="sm" className="mt-3" onClick={() => setFormOpen(true)}>
                Erstes Fahrzeug anlegen
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New vehicle dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Fahrzeug</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Kunde *</Label>
              <Select onValueChange={(v) => setValue('customer_id', v)}>
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

            <div className="space-y-1.5">
              <Label htmlFor="kennzeichen">Kennzeichen *</Label>
              <Input
                id="kennzeichen"
                placeholder="S-AB 1234"
                error={errors.kennzeichen?.message}
                {...register('kennzeichen')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="marke">Marke</Label>
                <Input id="marke" placeholder="BMW" {...register('marke')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modell">Modell</Label>
                <Input id="modell" placeholder="3er" {...register('modell')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="baujahr">Baujahr</Label>
                <Input id="baujahr" type="number" placeholder="2018" {...register('baujahr')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="letzter_km_stand">Kilometerstand</Label>
                <Input
                  id="letzter_km_stand"
                  type="number"
                  placeholder="87000"
                  {...register('letzter_km_stand')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tuev_datum">TÜV-Datum</Label>
                <Input id="tuev_datum" type="date" {...register('tuev_datum')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="letzte_inspektion">Letzte Inspektion</Label>
                <Input id="letzte_inspektion" type="date" {...register('letzte_inspektion')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vin">FIN / VIN</Label>
              <Input id="vin" placeholder="WBA..." {...register('vin')} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset(); setFormOpen(false); }}
              >
                Abbrechen
              </Button>
              <Button type="submit" loading={formLoading}>
                Fahrzeug anlegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleCard({
  vehicle,
  customers,
}: {
  vehicle: Vehicle;
  customers: { id: string; full_name: string }[];
}) {
  const tuev = getTuevStatus(vehicle.tuev_datum);
  const owner = customers.find((c) => c.id === vehicle.customer_id);

  return (
    <Card
      style={{
        borderColor:
          tuev.status === 'expired'
            ? 'rgba(239,68,68,0.5)'
            : tuev.status === 'warning'
            ? 'rgba(249,115,22,0.4)'
            : 'var(--border)',
      }}
    >
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono font-bold text-lg" style={{ color: 'var(--primary)' }}>
              {vehicle.kennzeichen}
            </span>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              {[vehicle.marke, vehicle.modell].filter(Boolean).join(' ') || '—'}
            </p>
          </div>
          <Car className="w-5 h-5 shrink-0" style={{ color: 'var(--muted)' }} />
        </div>

        <div className="space-y-1 text-xs" style={{ color: 'var(--muted)' }}>
          {vehicle.baujahr && <p>Baujahr: {vehicle.baujahr}</p>}
          {vehicle.letzter_km_stand && (
            <p>KM-Stand: {vehicle.letzter_km_stand.toLocaleString('de-DE')} km</p>
          )}
          {owner && <p>Besitzer: {owner.full_name}</p>}
        </div>

        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
          style={{
            backgroundColor: `${tuev.color}22`,
            color: tuev.color,
          }}
        >
          {tuev.status !== 'ok' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-xs font-medium">{tuev.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
