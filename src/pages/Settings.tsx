import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const settingsSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  phone: z.string().optional(),
  address: z.string().optional(),
  google_review_url: z.string().url('Ungültige URL').optional().or(z.literal('')),
  sms_enabled: z.boolean().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function Settings() {
  const { tenant, profile, refreshTenant } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tenant?.name ?? '',
      phone: tenant?.phone ?? '',
      address: tenant?.address ?? '',
      google_review_url: tenant?.google_review_url ?? '',
      sms_enabled: tenant?.sms_enabled ?? false,
    },
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        phone: tenant.phone ?? '',
        address: tenant.address ?? '',
        google_review_url: tenant.google_review_url ?? '',
        sms_enabled: tenant.sms_enabled,
      });
    }
  }, [tenant, reset]);

  const smsEnabled = watch('sms_enabled');

  const onSubmit = async (data: SettingsForm) => {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update({
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        google_review_url: data.google_review_url || null,
        sms_enabled: data.sms_enabled ?? false,
      })
      .eq('id', tenant.id);
    setSaving(false);
    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
      return;
    }
    await refreshTenant();
    toast.success('Einstellungen gespeichert.');
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Werkstatt settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            Werkstatt-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name">Werkstatt-Name *</Label>
              <Input
                id="name"
                placeholder="KFZ-Mustermann GmbH"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+49 711 123456"
                {...register('phone')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                placeholder="Musterstraße 1, 70000 Stuttgart"
                {...register('address')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="google_review_url">Google Bewertungs-URL</Label>
              <Input
                id="google_review_url"
                type="url"
                placeholder="https://g.page/r/..."
                error={errors.google_review_url?.message}
                {...register('google_review_url')}
              />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Wird automatisch in der Abgeholt-E-Mail verlinkt.
              </p>
            </div>

            {/* SMS toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  SMS-Benachrichtigungen
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Kunden automatisch per SMS informieren (Twilio erforderlich)
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={smsEnabled}
                onClick={() => setValue('sms_enabled', !smsEnabled)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  backgroundColor: smsEnabled ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: smsEnabled ? 'translateX(22px)' : 'translateX(4px)' }}
                />
              </button>
            </div>

            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4" />
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Konto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--muted)' }}>Name</span>
            <span style={{ color: 'var(--foreground)' }}>{profile?.full_name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--muted)' }}>Rolle</span>
            <span style={{ color: 'var(--foreground)' }}>{profile?.role ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--muted)' }}>Tenant-ID</span>
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {tenant?.id?.slice(0, 8) ?? '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
