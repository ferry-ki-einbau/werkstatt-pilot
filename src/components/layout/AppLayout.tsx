import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/auftraege': 'Aufträge',
  '/kunden': 'Kunden',
  '/fahrzeuge': 'Fahrzeuge',
  '/einstellungen': 'Einstellungen',
};

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  const match = Object.entries(PAGE_TITLES).find(
    ([path]) => path !== '/' && pathname.startsWith(path)
  );
  return match ? match[1] : 'Werkstatt-Pilot';
}

export function AppLayout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <Sidebar />

      {/* Main content area — offset for desktop sidebar */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
