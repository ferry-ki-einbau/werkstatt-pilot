import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Job, JobStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useJobs() {
  const { tenant } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*),
          technician:profiles(*)
        `)
        .eq('tenant_id', tenant.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setJobs((data as Job[]) ?? []);
    } catch (err) {
      console.error('[useJobs] fetchJobs error:', err);
      setError('Aufträge konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Realtime subscription
  useEffect(() => {
    if (!tenant) return;

    const channel = supabase
      .channel(`jobs:tenant:${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant, fetchJobs]);

  const createJob = useCallback(
    async (
      jobData: Omit<Job, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'customer' | 'vehicle' | 'technician'>
    ): Promise<{ error: string | null; job: Job | null }> => {
      if (!tenant) return { error: 'Kein Tenant', job: null };
      try {
        const { data, error: insertError } = await supabase
          .from('jobs')
          .insert({ ...jobData, tenant_id: tenant.id })
          .select(`*, customer:customers(*), vehicle:vehicles(*), technician:profiles(*)`)
          .single();

        if (insertError) throw insertError;
        return { error: null, job: data as Job };
      } catch (err) {
        console.error('[useJobs] createJob error:', err);
        return { error: 'Auftrag konnte nicht erstellt werden.', job: null };
      }
    },
    [tenant]
  );

  const updateJob = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Job, 'id' | 'tenant_id' | 'created_at'>>
    ): Promise<{ error: string | null }> => {
      try {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;
        return { error: null };
      } catch (err) {
        console.error('[useJobs] updateJob error:', err);
        return { error: 'Auftrag konnte nicht aktualisiert werden.' };
      }
    },
    []
  );

  const updateJobStatus = useCallback(
    async (id: string, status: JobStatus): Promise<{ error: string | null }> => {
      return updateJob(id, { status });
    },
    [updateJob]
  );

  const deleteJob = useCallback(async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: deleteError } = await supabase.from('jobs').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setJobs((prev) => prev.filter((j) => j.id !== id));
      return { error: null };
    } catch (err) {
      console.error('[useJobs] deleteJob error:', err);
      return { error: 'Auftrag konnte nicht gelöscht werden.' };
    }
  }, []);

  const getJobsByStatus = useCallback(
    (status: JobStatus) => jobs.filter((j) => j.status === status),
    [jobs]
  );

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    getJobsByStatus,
  };
}
