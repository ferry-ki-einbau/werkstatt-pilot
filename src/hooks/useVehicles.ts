import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useVehicles(customerId?: string) {
  const { tenant } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setVehicles((data as Vehicle[]) ?? []);
    } catch (err) {
      console.error('[useVehicles] fetchVehicles error:', err);
      setError('Fahrzeuge konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [tenant, customerId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const createVehicle = useCallback(
    async (
      vehicleData: Omit<Vehicle, 'id' | 'tenant_id' | 'created_at'>
    ): Promise<{ error: string | null; vehicle: Vehicle | null }> => {
      if (!tenant) return { error: 'Kein Tenant', vehicle: null };
      try {
        const { data, error: insertError } = await supabase
          .from('vehicles')
          .insert({ ...vehicleData, tenant_id: tenant.id })
          .select()
          .single();

        if (insertError) throw insertError;
        const newVehicle = data as Vehicle;
        setVehicles((prev) => [newVehicle, ...prev]);
        return { error: null, vehicle: newVehicle };
      } catch (err) {
        console.error('[useVehicles] createVehicle error:', err);
        return { error: 'Fahrzeug konnte nicht erstellt werden.', vehicle: null };
      }
    },
    [tenant]
  );

  const updateVehicle = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Vehicle, 'id' | 'tenant_id' | 'created_at'>>
    ): Promise<{ error: string | null }> => {
      try {
        const { data, error: updateError } = await supabase
          .from('vehicles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setVehicles((prev) => prev.map((v) => (v.id === id ? (data as Vehicle) : v)));
        return { error: null };
      } catch (err) {
        console.error('[useVehicles] updateVehicle error:', err);
        return { error: 'Fahrzeug konnte nicht aktualisiert werden.' };
      }
    },
    []
  );

  const deleteVehicle = useCallback(async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      return { error: null };
    } catch (err) {
      console.error('[useVehicles] deleteVehicle error:', err);
      return { error: 'Fahrzeug konnte nicht gelöscht werden.' };
    }
  }, []);

  return { vehicles, loading, error, fetchVehicles, createVehicle, updateVehicle, deleteVehicle };
}
