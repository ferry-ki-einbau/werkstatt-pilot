import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  Settings,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/auftraege', icon: ClipboardList, label: 'Aufträge' },
  { to: '/kunden', icon: Users, label: 'Kunden' },
  { to: '/fahrzeuge', icon: Car, label: 'Fahrzeuge' },
  { to: '/einstellungen', icon: Settings, label: 'Einstellungen' },
];

export function Sidebar() {
  const { tenant } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 min-h-screen border-r fixed left-0 top-0 z-30"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Wrench className="w-5 h-5 text-black" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
              Werkstatt-Pilot
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
              {tenant?.name ?? 'Meine Werkstatt'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-black'
                    : 'hover:bg-[var(--card-hover)]'
                )}
                style={
                  isActive
                    ? { backgroundColor: 'var(--primary)', color: 'black' }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Version */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Werkstatt-Pilot v1.0
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-center justify-around px-2 py-1"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-h-[44px] justify-center"
              style={isActive ? { color: 'var(--primary)' } : { color: 'var(--muted)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
