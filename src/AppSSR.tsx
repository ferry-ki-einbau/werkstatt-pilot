/**
 * SSR version of App — no lazy() imports, no Supabase auth calls.
 * Used only by entry-server.tsx for static prerendering.
 */
import { Route, Routes } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { DemoDashboard } from '@/pages/DemoDashboard';
import { Dashboard } from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { Vehicles } from '@/pages/Vehicles';
import { Settings } from '@/pages/Settings';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthContext } from '@/contexts/AuthContext';
import type React from 'react';

/**
 * SSR Auth Provider — uses the REAL AuthContext so useAuth() works,
 * but provides static mock values (no Supabase calls during SSR).
 */
const ssrAuthValue = {
  session: null,
  user: null,
  profile: null,
  tenant: null,
  loading: false,
  signIn: async () => ({ error: null as string | null }),
  signUp: async () => ({ error: null as string | null }),
  signOut: async () => {},
  refreshTenant: async () => {},
};

function SSRAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={ssrAuthValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * For SSR: protected routes just render the layout + children directly.
 * Since session=null, pages that check session will show their "no auth" state.
 * We don't use <Navigate> here because it causes warnings in StaticRouter.
 */
export default function AppSSR() {
  return (
    <SSRAuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes — render with AppLayout shell for SSR */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auftraege" element={<Dashboard />} />
          <Route path="/kunden" element={<Customers />} />
          <Route path="/fahrzeuge" element={<Vehicles />} />
          <Route path="/einstellungen" element={<Settings />} />
        </Route>

        {/* Demo — no auth needed */}
        <Route path="/demo" element={<DemoDashboard />} />

        {/* Fallback — render login for unknown routes */}
        <Route path="*" element={<Login />} />
      </Routes>
    </SSRAuthProvider>
  );
}
