import { useMemo } from 'react';
import { Car, ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { getTuevStatus } from '@/lib/utils';
import { format } from 'date-fns';

function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {label}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
              {value}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}22` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { tenant } = useAuth();
  const { jobs } = useJobs();
  const { vehicles } = useVehicles();

  const today = format(new Date(), 'yyyy-MM-dd');

  const kpis = useMemo(() => {
    const open = jobs.filter((j) => j.status !== 'abgeholt').length;
    const readyToday = jobs.filter(
      (j) => j.status === 'abholbereit' && j.estimated_ready === today
    ).length;
    const urgent = jobs.filter(
      (j) => (j.priority === 'urgent' || j.priority === 'high') && j.status !== 'abgeholt'
    ).length;
    const tuevWarning = vehicles.filter((v) => {
      const s = getTuevStatus(v.tuev_datum);
      return s.status === 'warning' || s.status === 'expired';
    }).length;

    return { open, readyToday, urgent, tuevWarning };
  }, [jobs, vehicles, today]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Guten Tag! 👋
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {tenant?.name ?? 'Ihre Werkstatt'} — Heute: {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: undefined })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Offene Aufträge"
          value={kpis.open}
          icon={ClipboardList}
          color="#f59e0b"
        />
        <KPICard
          label="Heute abholbereit"
          value={kpis.readyToday}
          icon={CheckCircle}
          color="#22c55e"
        />
        <KPICard
          label="Dringend / Hoch"
          value={kpis.urgent}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <KPICard
          label="TÜV-Warnungen"
          value={kpis.tuevWarning}
          icon={Car}
          color="#f97316"
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard />
    </div>
  );
}
