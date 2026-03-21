import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDroppable, useDraggable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import {
  Wrench, LogIn, Phone, CheckCircle2, Clock, CalendarDays,
  List, ChevronRight, GripVertical, Plus, Car,
  AlertTriangle, MessageSquare, Star,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'annahme' | 'diagnose' | 'teile_bestellt' | 'teile_da' | 'reparatur' | 'abholbereit' | 'abgeholt';

interface Job {
  id: string;
  kennzeichen: string;
  kunde: string;
  telefon: string;
  titel: string;
  status: Status;
  priority: 'normal' | 'high' | 'urgent';
  uhrzeit?: string;
  smsGesendet?: boolean;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS: Record<Status, { label: string; color: string; short: string }> = {
  annahme:        { label: 'Annahme',        color: '#3b82f6', short: 'NEU'   },
  diagnose:       { label: 'Diagnose',       color: '#eab308', short: 'DIAG'  },
  teile_bestellt: { label: 'Teile bestellt', color: '#f97316', short: 'BEST'  },
  teile_da:       { label: 'Teile da',       color: '#a855f7', short: 'BEREIT'},
  reparatur:      { label: 'In Reparatur',   color: '#ef4444', short: 'REP'   },
  abholbereit:    { label: 'Abholbereit',    color: '#22c55e', short: 'FERTIG'},
  abgeholt:       { label: 'Abgeholt',       color: '#6b7280', short: 'WEG'   },
};

const ORDER: Status[] = ['annahme','diagnose','teile_bestellt','teile_da','reparatur','abholbereit','abgeholt'];

// ─── Demo data ────────────────────────────────────────────────────────────────

const INIT: Job[] = [
  { id:'1', kennzeichen:'S-KR 4421',  kunde:'Thomas Krause',    telefon:'+49 711 123456',  titel:'Ölwechsel + Inspektion',      status:'annahme',        priority:'normal', uhrzeit:'08:00' },
  { id:'2', kennzeichen:'WN-BM 882',  kunde:'Sabine Müller',    telefon:'+49 7151 98765',  titel:'Bremsen vorne erneuern',      status:'diagnose',       priority:'high',   uhrzeit:'09:30' },
  { id:'3', kennzeichen:'S-AX 1199',  kunde:'Klaus Hofmann',    telefon:'+49 711 556677',  titel:'Klimaanlage befüllen',        status:'teile_bestellt', priority:'normal', uhrzeit:'10:00' },
  { id:'4', kennzeichen:'ES-TF 330',  kunde:'Maria Weber',      telefon:'+49 711 778899',  titel:'Stoßdämpfer tauschen',        status:'teile_da',       priority:'urgent', uhrzeit:'11:00' },
  { id:'5', kennzeichen:'WN-GO 77',   kunde:'Peter Schmidt',    telefon:'+49 7151 334455', titel:'Motor läuft unrund',          status:'reparatur',      priority:'high',   uhrzeit:'13:00' },
  { id:'6', kennzeichen:'S-LK 2233',  kunde:'Anna Becker',      telefon:'+49 711 990011',  titel:'TÜV-Vorbereitung + HU',      status:'abholbereit',    priority:'normal', uhrzeit:'14:00', smsGesendet:true },
  { id:'7', kennzeichen:'WN-RT 991',  kunde:'Hans Zimmermann',  telefon:'+49 7151 223344', titel:'Reifenwechsel Sommer',        status:'abgeholt',       priority:'normal', uhrzeit:'15:30', smsGesendet:true },
  { id:'8', kennzeichen:'S-MB 5511',  kunde:'Julia Fischer',    telefon:'+49 711 667788',  titel:'Zahnriemen wechseln',         status:'reparatur',      priority:'urgent', uhrzeit:'09:00' },
  { id:'9', kennzeichen:'ES-WK 448',  kunde:'Michael Braun',    telefon:'+49 711 445566',  titel:'Auspuffanlage erneuern',      status:'annahme',        priority:'normal', uhrzeit:'16:00' },
];

const TERMINE = [
  { id:'t1', tag:'Montag',     datum:'24.03.',  uhrzeit:'08:00', kunde:'Frank Bauer',      kennzeichen:'S-FB 110',  grund:'Inspektion + TÜV' },
  { id:'t2', tag:'Montag',     datum:'24.03.',  uhrzeit:'10:30', kunde:'Erika Vogel',      kennzeichen:'WN-EV 44',  grund:'Bremsen hinten' },
  { id:'t3', tag:'Dienstag',   datum:'25.03.',  uhrzeit:'08:00', kunde:'Stefan Lenz',      kennzeichen:'S-SL 778',  grund:'Ölwechsel' },
  { id:'t4', tag:'Dienstag',   datum:'25.03.',  uhrzeit:'11:00', kunde:'Monika Klein',     kennzeichen:'ES-MK 99',  grund:'Klimaanlage' },
  { id:'t5', tag:'Mittwoch',   datum:'26.03.',  uhrzeit:'09:00', kunde:'Rainer Schulz',    kennzeichen:'WN-RS 555', grund:'Zahnriemen' },
  { id:'t6', tag:'Donnerstag', datum:'27.03.',  uhrzeit:'08:30', kunde:'Carla Müller',     kennzeichen:'S-CM 321',  grund:'Fehlerdiagnose' },
  { id:'t7', tag:'Freitag',    datum:'28.03.',  uhrzeit:'10:00', kunde:'Ahmed Hassan',     kennzeichen:'S-AH 77',   grund:'Reifenwechsel' },
];

// ─── Kleine Helfer-Komponenten ────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  const { label, color } = STATUS[status];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: color + '22', color }}
    >
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Job['priority'] }) {
  if (priority === 'normal') return null;
  const color = priority === 'urgent' ? '#ef4444' : '#f97316';
  const label = priority === 'urgent' ? '🔴 Dringend' : '🟠 Hoch';
  return (
    <span className="text-xs font-semibold" style={{ color }}>{label}</span>
  );
}

// ─── Heute-Tab ────────────────────────────────────────────────────────────────

function HeuteTab({ jobs, onStatusChange }: { jobs: Job[]; onStatusChange: (id: string, s: Status) => void }) {
  const abholbereit = jobs.filter(j => j.status === 'abholbereit');
  const inArbeit    = jobs.filter(j => ['diagnose','teile_bestellt','teile_da','reparatur'].includes(j.status));
  const neu         = jobs.filter(j => j.status === 'annahme');

  function Section({ title, color, icon: Icon, items, nextStatus, actionLabel }:{
    title: string; color: string; icon: React.ElementType;
    items: Job[]; nextStatus?: Status; actionLabel?: string;
  }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ backgroundColor: color + '20', color }}>{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs px-4 py-6 text-center rounded-xl" style={{ color:'#6b6b78', border:'1px dashed var(--border)' }}>Keine Einträge</p>
        ) : (
          <div className="space-y-2">
            {items.map(job => (
              <div
                key={job.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ backgroundColor:'var(--card)', border:'1px solid var(--border)' }}
              >
                {/* Time */}
                {job.uhrzeit && (
                  <div className="shrink-0 text-center w-12">
                    <p className="text-xs font-bold" style={{ color:'var(--primary)' }}>{job.uhrzeit}</p>
                    <p className="text-xs" style={{ color:'#6b6b78' }}>Uhr</p>
                  </div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm" style={{ color:'var(--foreground)', fontFamily:'monospace' }}>{job.kennzeichen}</span>
                    <PriorityBadge priority={job.priority} />
                  </div>
                  <p className="text-xs truncate" style={{ color:'#9ca3af' }}>{job.titel}</p>
                  <p className="text-xs mt-0.5" style={{ color:'#6b6b78' }}>{job.kunde}</p>
                </div>
                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2">
                  {job.smsGesendet && (
                    <span className="text-xs flex items-center gap-1" style={{ color:'#22c55e' }}>
                      <MessageSquare className="w-3 h-3" /> SMS ✓
                    </span>
                  )}
                  <a
                    href={`tel:${job.telefon}`}
                    className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
                    style={{ backgroundColor:'rgba(59,130,246,0.12)', color:'#3b82f6' }}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  {nextStatus && actionLabel && (
                    <button
                      onClick={() => onStatusChange(job.id, nextStatus)}
                      className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-colors"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {actionLabel} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Section title="Abholbereit — Kunden benachrichtigt" color="#22c55e" icon={CheckCircle2} items={abholbereit} nextStatus="abgeholt" actionLabel="Abgeholt" />
      <Section title="Heute in der Werkstatt" color="#ef4444" icon={Wrench} items={inArbeit} />
      <Section title="Heute Annahme" color="#3b82f6" icon={Car} items={neu} nextStatus="diagnose" actionLabel="Diagnose starten" />
    </div>
  );
}

// ─── Kanban-Tab ───────────────────────────────────────────────────────────────

function KanbanCard({ job, onJobClick }: { job: Job; onJobClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id });
  return (
    <div
      ref={setNodeRef}
      onClick={onJobClick}
      style={{
        transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined,
        opacity: isDragging ? 0.3 : 1,
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-bold text-xs tracking-wider" style={{ color:'var(--foreground)', fontFamily:'monospace' }}>{job.kennzeichen}</span>
        <div {...attributes} {...listeners} className="shrink-0 mt-0.5" style={{ color:'#4b4b55', cursor:'grab' }}>
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-xs leading-snug mb-2" style={{ color:'#9ca3af' }}>{job.titel}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color:'#6b6b78' }}>{job.kunde.split(' ')[0]}</span>
        {job.priority !== 'normal' && (
          <span className="text-xs" style={{ color: job.priority === 'urgent' ? '#ef4444' : '#f97316' }}>
            {job.priority === 'urgent' ? '●' : '●'}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanCol({ status, jobs, onJobClick }: { status: Status; jobs: Job[]; onJobClick: (j: Job) => void }) {
  const { label, color } = STATUS[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="shrink-0 flex flex-col gap-2" style={{ width: 200 }}>
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold" style={{ color:'var(--foreground)' }}>{label}</span>
        </div>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: color + '22', color }}>{jobs.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 rounded-xl p-2 transition-colors min-h-[180px]"
        style={{
          backgroundColor: isOver ? color + '10' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${isOver ? color + '55' : 'var(--border)'}`,
        }}
      >
        {jobs.map(j => <KanbanCard key={j.id} job={j} onJobClick={() => onJobClick(j)} />)}
      </div>
    </div>
  );
}

function KanbanTab({ jobs, onChange }: { jobs: Job[]; onChange: (id: string, s: Status) => void }) {
  const [active, setActive] = useState<Job | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );
  const onDragStart = (e: DragStartEvent) => setActive(jobs.find(j => j.id === e.active.id) ?? null);
  const onDragEnd   = (e: DragEndEvent)   => {
    setActive(null);
    const ns = ORDER.find(s => s === e.over?.id);
    if (ns) onChange(e.active.id as string, ns);
  };

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-4 pb-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-3 min-w-max">
            {ORDER.map(s => (
              <KanbanCol key={s} status={s} jobs={jobs.filter(j => j.status === s)} onJobClick={setSelected} />
            ))}
          </div>
          <DragOverlay>
            {active && (
              <div className="rounded-xl p-3 shadow-2xl rotate-2" style={{ backgroundColor:'var(--card)', border:'1px solid var(--primary)', width:200 }}>
                <p className="font-bold text-xs" style={{ color:'var(--foreground)', fontFamily:'monospace' }}>{active.kennzeichen}</p>
                <p className="text-xs mt-1" style={{ color:'#9ca3af' }}>{active.titel}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Job detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor:'rgba(0,0,0,0.75)' }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor:'var(--card)', border:'1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            {/* Color bar */}
            <div className="h-1" style={{ backgroundColor: STATUS[selected.status].color }} />
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-black tracking-wider" style={{ color:'var(--foreground)', fontFamily:'monospace' }}>{selected.kennzeichen}</p>
                  <p className="text-sm mt-0.5" style={{ color:'#9ca3af' }}>{selected.titel}</p>
                </div>
                <StatusPill status={selected.status} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color:'#6b6b78' }}>Kunde</p>
                  <p className="text-sm font-semibold" style={{ color:'var(--foreground)' }}>{selected.kunde}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                  <p className="text-xs mb-1" style={{ color:'#6b6b78' }}>Priorität</p>
                  <p className="text-sm font-semibold" style={{ color: selected.priority==='urgent'?'#ef4444':selected.priority==='high'?'#f97316':'#6b6b78' }}>
                    {selected.priority==='urgent'?'🔴 Dringend':selected.priority==='high'?'🟠 Hoch':'Normal'}
                  </p>
                </div>
              </div>
              {/* Next status buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color:'#6b6b78' }}>Status ändern →</p>
                <div className="flex flex-wrap gap-2">
                  {ORDER.filter(s => s !== selected.status).slice(0,4).map(s => (
                    <button
                      key={s}
                      onClick={() => { onChange(selected.id, s); setSelected(null); }}
                      className="text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                      style={{ backgroundColor: STATUS[s].color + '20', color: STATUS[s].color, border: `1px solid ${STATUS[s].color}40` }}
                    >
                      {STATUS[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <a
                href={`tel:${selected.telefon}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm"
                style={{ backgroundColor:'rgba(59,130,246,0.12)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.25)' }}
              >
                <Phone className="w-4 h-4" /> {selected.telefon} anrufen
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Termine-Tab ──────────────────────────────────────────────────────────────

function TermineTab() {
  const tage = [...new Set(TERMINE.map(t => t.tag))];
  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:'var(--primary)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color:'var(--primary)' }}>Demo-Kalender</p>
          <p className="text-xs mt-0.5" style={{ color:'#9ca3af' }}>Im echten System: Termin anlegen → bei Ankunft 1 Klick → wird automatisch zum Auftrag im Kanban</p>
        </div>
      </div>

      {tage.map(tag => {
        const termine = TERMINE.filter(t => t.tag === tag);
        const isHeute = tag === 'Montag'; // Montag = heute im Demo
        return (
          <div key={tag}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold" style={{ color: isHeute ? 'var(--primary)' : 'var(--foreground)' }}>{tag}</span>
              <span className="text-xs" style={{ color:'#6b6b78' }}>{termine[0].datum}</span>
              {isHeute && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor:'rgba(245,158,11,0.2)', color:'var(--primary)' }}>Heute</span>}
              <div className="flex-1 h-px" style={{ backgroundColor:'var(--border)' }} />
            </div>
            <div className="space-y-2">
              {termine.map(t => (
                <div key={t.id} className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor:'var(--card)', border:'1px solid var(--border)' }}>
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-sm font-black" style={{ color: isHeute ? 'var(--primary)' : 'var(--foreground)' }}>{t.uhrzeit}</p>
                    <p className="text-xs" style={{ color:'#6b6b78' }}>Uhr</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color:'var(--foreground)' }}>{t.kunde}</p>
                    <p className="text-xs" style={{ color:'#9ca3af' }}>
                      <span style={{ fontFamily:'monospace' }}>{t.kennzeichen}</span>
                      {' · '}{t.grund}
                    </p>
                  </div>
                  {isHeute && (
                    <button
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                      style={{ backgroundColor:'rgba(34,197,94,0.15)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.25)' }}
                    >
                      <Plus className="w-3 h-3" /> Auftrag
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

type Tab = 'heute' | 'auftraege' | 'termine';

export function DemoDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>(INIT);
  const [tab, setTab] = useState<Tab>('heute');

  const onChange = (id: string, s: Status) => setJobs(prev => prev.map(j => j.id === id ? { ...j, status: s } : j));

  const open       = jobs.filter(j => j.status !== 'abgeholt').length;
  const abholbereit = jobs.filter(j => j.status === 'abholbereit').length;
  const urgent     = jobs.filter(j => j.priority === 'urgent' && j.status !== 'abgeholt').length;

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key:'heute',     label:'Heute',    icon: Clock        },
    { key:'auftraege', label:'Aufträge', icon: List },
    { key:'termine',   label:'Termine',  icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor:'var(--background)' }}>

      {/* ── Topbar ── */}
      <div className="sticky top-0 z-40" style={{ backgroundColor:'var(--card)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ backgroundColor:'var(--primary)' }}>
              <Wrench className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none" style={{ color:'var(--foreground)' }}>Werkstatt-Pilot</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--primary)' }}>Demo-Modus</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ backgroundColor:'var(--primary)', color:'#000' }}
          >
            <LogIn className="w-3.5 h-3.5" />
            Kostenlos starten
          </button>
        </div>

        {/* ── KPI-Zeile ── */}
        <div className="grid grid-cols-3 gap-px" style={{ backgroundColor:'var(--border)' }}>
          {[
            { label:'Offene Aufträge', value:open,        color:'#f59e0b' },
            { label:'Abholbereit',    value:abholbereit,  color:'#22c55e' },
            { label:'Dringend',       value:urgent,       color:'#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-3" style={{ backgroundColor:'var(--card)' }}>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color:'#6b6b78' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex" style={{ backgroundColor:'var(--background)' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative"
              style={{ color: tab===key ? 'var(--primary)' : '#6b6b78' }}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tab === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor:'var(--primary)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 max-w-3xl mx-auto">

        {/* Demo banner */}
        <div className="rounded-xl p-3.5 mb-5 flex items-center justify-between gap-3" style={{ backgroundColor:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 shrink-0" style={{ color:'var(--primary)' }} />
            <p className="text-xs" style={{ color:'#a0a0a8' }}>
              <span className="font-semibold" style={{ color:'var(--foreground)' }}>Echte Demo — </span>
              Karten verschieben, Status ändern, Anrufen klicken
            </p>
          </div>
          <button onClick={() => navigate('/register')} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor:'var(--primary)', color:'#000' }}>
            Meine Werkstatt
          </button>
        </div>

        {tab === 'heute'     && <HeuteTab jobs={jobs} onStatusChange={onChange} />}
        {tab === 'auftraege' && <KanbanTab jobs={jobs} onChange={onChange} />}
        {tab === 'termine'   && <TermineTab />}
      </div>
    </div>
  );
}
