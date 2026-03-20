import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useCustomers() {
  const { tenant } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;
      setCustomers((data as Customer[]) ?? []);
    } catch (err) {
      console.error('[useCustomers] fetchCustomers error:', err);
      setError('Kunden konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = useCallback(
    async (
      customerData: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>
    ): Promise<{ error: string | null; customer: Customer | null }> => {
      if (!tenant) return { error: 'Kein Tenant', customer: null };
      try {
        const { data, error: insertError } = await supabase
          .from('customers')
          .insert({ ...customerData, tenant_id: tenant.id })
          .select()
          .single();

        if (insertError) throw insertError;
        const newCustomer = data as Customer;
        setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.full_name.localeCompare(b.full_name)));
        return { error: null, customer: newCustomer };
      } catch (err) {
        console.error('[useCustomers] createCustomer error:', err);
        return { error: 'Kunde konnte nicht erstellt werden.', customer: null };
      }
    },
    [tenant]
  );

  const updateCustomer = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Customer, 'id' | 'tenant_id' | 'created_at'>>
    ): Promise<{ error: string | null }> => {
      try {
        const { data, error: updateError } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setCustomers((prev) => prev.map((c) => (c.id === id ? (data as Customer) : c)));
        return { error: null };
      } catch (err) {
        console.error('[useCustomers] updateCustomer error:', err);
        return { error: 'Kunde konnte nicht aktualisiert werden.' };
      }
    },
    []
  );

  const deleteCustomer = useCallback(async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase.from('customers').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err) {
      console.error('[useCustomers] deleteCustomer error:', err);
      return { error: 'Kunde konnte nicht gelöscht werden.' };
    }
  }, []);

  return { customers, loading, error, fetchCustomers, createCustomer, updateCustomer, deleteCustomer };
}
