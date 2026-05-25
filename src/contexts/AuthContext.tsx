import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Tenant } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    werkstattName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndTenant = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) return;
      setProfile(profileData as Profile);

      if (profileData.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .single();

        if (!tenantError && tenantData) {
          setTenant(tenantData as Tenant);
        }
      }
    } catch (err) {
      console.error('[AuthContext] loadProfileAndTenant error:', err);
    }
  }, []);

  const refreshTenant = useCallback(async () => {
    if (!profile?.tenant_id) return;
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();
    if (!error && data) setTenant(data as Tenant);
  }, [profile?.tenant_id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfileAndTenant(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await loadProfileAndTenant(s.user.id);
        } else {
          setProfile(null);
          setTenant(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfileAndTenant]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    werkstattName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Registrierung fehlgeschlagen.' };

    // Create tenant
    const slug = werkstattName
      .toLowerCase()
      .replace(/[äöü]/g, (c: string) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: werkstattName, slug: `${slug}-${Date.now()}` })
      .select()
      .single();

    if (tenantError || !tenantData) {
      return { error: 'Werkstatt konnte nicht angelegt werden.' };
    }

    // Link profile to tenant + set role owner
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tenant_id: tenantData.id, full_name: fullName, role: 'owner' })
      .eq('id', data.user.id);

    if (profileError) return { error: 'Profil konnte nicht aktualisiert werden.' };

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, tenant, loading, signIn, signUp, signOut, refreshTenant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
