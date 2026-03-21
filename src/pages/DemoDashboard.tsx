import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Phone, Clock, CalendarDays, List,
  ChevronRight, ChevronDown, Plus,
  MessageSquare, ArrowRight, X, Bell,
} from 'lucide-react';

// ─── CSS-in-JS light theme ────────────────────────────────────────────────────
const T = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  borderMd:  '#cbd5e1',
  text:      '#0f172a',
  textMd:    '#475569',
  textSm:    '#94a3b8',
  amber:     '#f59e0b',
  amberBg:   '#fffbeb',
  amberBd:   '#fde68a',
  green:     '#16a34a',
  greenBg:   '#f0fdf4',
  greenBd:   '#bbf7d0',
  blue:      '#2563eb',
  blueBg:    '#eff6ff',
  blueBd:    '#bfdbfe',
  red:       '#dc2626',
  redBg:     '#fef2f2',
  orange:    '#ea580c',
  purple:    '#9333ea',
  yellow:    '#ca8a04',
  gray:      '#64748b',
  grayBg:    '#f1f5f9',
  shadow:    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
  shadowMd:  '0 4px 12px rgba(0,0,0,0.1)',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'annahme'|'diagnose'|'teile_bestellt'|'teile_da'|'reparatur'|'abholbereit'|'abgeholt';
type Priority = 'normal'|'high'|'urgent';

interface Job {
  id: string; kennzeichen: string; kunde: string; telefon: string;
  titel: string; status: Status; priority: Priority; uhrzeit?: string; smsGesendet?: boolean;
}

// ─── Status-Konfiguration ─────────────────────────────────────────────────────
const S: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  annahme:        { label:'Annahme',        color: T.blue,   bg: T.blueBg,  border: T.blueBd  },
  diagnose:       { label:'Diagnose',       color: T.yellow, bg:'#fefce8',  border:'#fef08a'  },
  teile_bestellt: { label:'Teile bestellt', color: T.orange, bg:'#fff7ed',  border:'#fed7aa'  },
  teile_da:       { label:'Teile da',       color: T.purple, bg:'#faf5ff',  border:'#e9d5ff'  },
  reparatur:      { label:'In Reparatur',   color: T.red,    bg: T.redBg,   border:'#fecaca'  },
  abholbereit:    { label:'Abholbereit',    color: T.green,  bg: T.greenBg, border: T.greenBd },
  abgeholt:       { label:'Abgeholt',       color: T.gray,   bg: T.grayBg,  border: T.border  },
};
const ORDER: Status[] = ['annahme','diagnose','teile_bestellt','teile_da','reparatur','abholbereit','abgeholt'];

// ─── Demo-Daten ───────────────────────────────────────────────────────────────
const INIT: Job[] = [
  { id:'1', kennzeichen:'S-KR 4421',  kunde:'Thomas Krause',   telefon:'+49 711 123456',  titel:'Ölwechsel + Inspektion',   status:'annahme',        priority:'normal', uhrzeit:'08:00' },
  { id:'2', kennzeichen:'WN-BM 882',  kunde:'Sabine Müller',   telefon:'+49 7151 98765',  titel:'Bremsen vorne erneuern',   status:'diagnose',       priority:'high',   uhrzeit:'09:30' },
  { id:'3', kennzeichen:'S-AX 1199',  kunde:'Klaus Hofmann',   telefon:'+49 711 556677',  titel:'Klimaanlage befüllen',     status:'teile_bestellt', priority:'normal', uhrzeit:'10:00' },
  { id:'4', kennzeichen:'ES-TF 330',  kunde:'Maria Weber',     telefon:'+49 711 778899',  titel:'Stoßdämpfer tauschen',     status:'teile_da',       priority:'urgent', uhrzeit:'11:00' },
  { id:'5', kennzeichen:'WN-GO 77',   kunde:'Peter Schmidt',   telefon:'+49 7151 334455', titel:'Motor läuft unrund',       status:'reparatur',      priority:'high',   uhrzeit:'13:00' },
  { id:'6', kennzeichen:'S-LK 2233',  kunde:'Anna Becker',     telefon:'+49 711 990011',  titel:'TÜV-Vorbereitung + HU',   status:'abholbereit',    priority:'normal', uhrzeit:'14:00', smsGesendet:true },
  { id:'7', kennzeichen:'WN-RT 991',  kunde:'Hans Zimmermann', telefon:'+49 7151 223344', titel:'Reifenwechsel Sommer',     status:'abgeholt',       priority:'normal', uhrzeit:'15:30', smsGesendet:true },
  { id:'8', kennzeichen:'S-MB 5511',  kunde:'Julia Fischer',   telefon:'+49 711 667788',  titel:'Zahnriemen wechseln',      status:'reparatur',      priority:'urgent', uhrzeit:'09:00' },
  { id:'9', kennzeichen:'ES-WK 448',  kunde:'Michael Braun',   telefon:'+49 711 445566',  titel:'Auspuffanlage erneuern',   status:'annahme',        priority:'normal', uhrzeit:'16:00' },
];

const TERMINE = [
  { id:'t1', tag:'Montag',    datum:'24.03.', uhrzeit:'08:00', kunde:'Frank Bauer',    kennzeichen:'S-FB 110',  grund:'Inspektion + TÜV',  heute:true },
  { id:'t2', tag:'Montag',    datum:'24.03.', uhrzeit:'10:30', kunde:'Erika Vogel',    kennzeichen:'WN-EV 44',  grund:'Bremsen hinten',    heute:true },
  { id:'t3', tag:'Montag',    datum:'24.03.', uhrzeit:'14:00', kunde:'Stefan Lenz',    kennzeichen:'S-SL 778',  grund:'Ölwechsel',         heute:true },
  { id:'t4', tag:'Dienstag',  datum:'25.03.', uhrzeit:'08:00', kunde:'Monika Klein',   kennzeichen:'ES-MK 99',  grund:'Klimaanlage',       heute:false },
  { id:'t5', tag:'Dienstag',  datum:'25.03.', uhrzeit:'11:00', kunde:'Rainer Schulz',  kennzeichen:'WN-RS 555', grund:'Zahnriemen',        heute:false },
  { id:'t6', tag:'Mittwoch',  datum:'26.03.', uhrzeit:'09:00', kunde:'Carla Müller',   kennzeichen:'S-CM 321',  grund:'Fehlerdiagnose',    heute:false },
  { id:'t7', tag:'Donnerstag',datum:'27.03.', uhrzeit:'08:30', kunde:'Ahmed Hassan',   kennzeichen:'S-AH 77',   grund:'Reifenwechsel',     heute:false },
  { id:'t8', tag:'Freitag',   datum:'28.03.', uhrzeit:'10:00', kunde:'Lisa Neumann',   kennzeichen:'ES-LN 12',  grund:'Inspektion',        heute:false },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const { label, color, bg, border } = S[status];
  return (
    <span style={{ backgroundColor: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function Dot({ priority }: { priority: Priority }) {
  if (priority === 'normal') return null;
  return <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', backgroundColor: priority==='urgent'?T.red:T.orange, flexShrink:0 }} />;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width:32, height:32, borderRadius:'50%', backgroundColor: T.amberBg, border:`2px solid ${T.amberBd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:T.amber, flexShrink:0 }}>
      {initials}
    </div>
  );
}

// ─── Nächster Schritt je Status ───────────────────────────────────────────────
const NEXT: Partial<Record<Status, { status: Status; label: string; color: string }>> = {
  annahme:        { status:'diagnose',       label:'Diagnose starten',      color: '#ca8a04' },
  diagnose:       { status:'teile_bestellt', label:'Teile bestellen',       color: '#ea580c' },
  teile_bestellt: { status:'teile_da',       label:'Teile eingetroffen ✓',  color: '#9333ea' },
  teile_da:       { status:'reparatur',      label:'Reparatur starten',     color: '#dc2626' },
  reparatur:      { status:'abholbereit',    label:'Fertig — Abholbereit 🎉', color: T.green  },
  abholbereit:    { status:'abgeholt',       label:'Abgeholt ✓',            color: T.gray   },
};

const SORT_PRIORITY: Status[] = ['abholbereit','reparatur','teile_da','teile_bestellt','diagnose','annahme','abgeholt'];

// ─── Mechaniker-Karte ─────────────────────────────────────────────────────────
function MechCard({ job, onNext }: { job: Job; onNext: (s: Status) => void }) {
  const { color, bg, border, label } = S[job.status];
  const next = NEXT[job.status];
  const done = job.status === 'abgeholt';

  return (
    <div style={{
      background: done ? T.grayBg : T.surface,
      border: `1px solid ${done ? T.border : border}`,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: done ? 'none' : T.shadow,
      opacity: done ? 0.55 : 1,
    }}>
      {/* Farbstreifen oben */}
      <div style={{ height: 5, backgroundColor: color }} />

      <div style={{ padding: '16px 16px 14px' }}>
        {/* Priorität-Banner */}
        {job.priority === 'urgent' && !done && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🔴</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.red }}>DRINGEND — sofort bearbeiten</span>
          </div>
        )}
        {job.priority === 'high' && !done && (
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 10px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🟠</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.orange }}>Hohe Priorität</span>
          </div>
        )}

        {/* Kennzeichen + Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: '0.06em', lineHeight: 1 }}>
            {job.kennzeichen}
          </span>
          <span style={{ backgroundColor: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 4 }}>
            {label}
          </span>
        </div>

        {/* Aufgabe */}
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>{job.titel}</div>
        <div style={{ fontSize: 13, color: T.textSm, marginBottom: job.smsGesendet ? 8 : 0 }}>{job.kunde}</div>

        {job.smsGesendet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.green, fontWeight: 600, marginBottom: 4 }}>
            <MessageSquare size={11} /> SMS an Kunde gesendet
          </div>
        )}
      </div>

      {/* Action-Button — volle Breite, großes Touch-Target */}
      {next && !done && (
        <button
          onClick={() => onNext(next.status)}
          style={{
            width: '100%', minHeight: 60, border: 'none', cursor: 'pointer',
            backgroundColor: next.color, color: '#fff',
            fontSize: 16, fontWeight: 800, letterSpacing: '0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'opacity 0.1s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          {next.label} <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      )}
      {done && (
        <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: T.textSm, borderTop: `1px solid ${T.border}` }}>
          ✅ Abgeschlossen
        </div>
      )}
    </div>
  );
}

// ─── Heute-Tab ────────────────────────────────────────────────────────────────
function HeuteTab({ jobs, onChange }: { jobs: Job[]; onChange: (id:string, s:Status)=>void }) {
  const priorityWeight = (p: Priority) => p === 'urgent' ? 0 : p === 'high' ? 1 : 2;

  const sorted = [...jobs].sort((a, b) => {
    const si = SORT_PRIORITY.indexOf(a.status) - SORT_PRIORITY.indexOf(b.status);
    if (si !== 0) return si;
    return priorityWeight(a.priority) - priorityWeight(b.priority);
  });

  const open   = sorted.filter(j => j.status !== 'abgeholt');
  const closed = sorted.filter(j => j.status === 'abgeholt');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {open.map(j => (
        <MechCard key={j.id} job={j} onNext={(s) => onChange(j.id, s)} />
      ))}
      {closed.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSm, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '8px 0 10px', textAlign: 'center' }}>
            Heute abgeholt ({closed.length})
          </div>
          {closed.map(j => (
            <MechCard key={j.id} job={j} onNext={(s) => onChange(j.id, s)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aufträge-Tab (Listenansicht, kein horizontaler Scroll) ──────────────────
function AuftraegeTab({ jobs, onChange }: { jobs:Job[]; onChange:(id:string,s:Status)=>void }) {
  const [selected, setSelected] = useState<Job|null>(null);
  const [collapsed, setCollapsed] = useState<Record<Status,boolean>>({} as Record<Status,boolean>);

  const toggle = (s: Status) => setCollapsed(p => ({ ...p, [s]: !p[s] }));

  const activeStatuses = ORDER.filter(s => jobs.some(j => j.status === s));

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {activeStatuses.map(s => {
          const group = jobs.filter(j => j.status === s);
          const { label, color, bg, border } = S[s];
          const isOpen = !collapsed[s];
          return (
            <div key={s} style={{ background: T.surface, borderRadius:14, border:`1px solid ${T.border}`, overflow:'hidden', boxShadow: T.shadow }}>
              {/* Group header */}
              <button
                onClick={() => toggle(s)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
              >
                <span style={{ width:10, height:10, borderRadius:'50%', backgroundColor: color, display:'inline-block', flexShrink:0 }} />
                <span style={{ fontSize:14, fontWeight:700, color: T.text, flex:1 }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20, backgroundColor: bg, color, border:`1px solid ${border}` }}>
                  {group.length}
                </span>
                {isOpen ? <ChevronDown size={15} color={T.textSm}/> : <ChevronRight size={15} color={T.textSm}/>}
              </button>

              {/* Job rows */}
              {isOpen && group.length > 0 && (
                <div style={{ borderTop:`1px solid ${T.border}` }}>
                  {group.map((job, idx) => (
                    <div
                      key={job.id}
                      onClick={() => setSelected(job)}
                      style={{
                        display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                        borderTop: idx > 0 ? `1px solid ${T.border}` : undefined,
                        cursor:'pointer', transition:'background 0.1s',
                        borderLeft:`4px solid ${color}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.bg)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Avatar name={job.kunde} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                          <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:13, color: T.text, letterSpacing:'0.05em' }}>{job.kennzeichen}</span>
                          <Dot priority={job.priority} />
                          {job.priority === 'urgent' && <span style={{ fontSize:10, fontWeight:700, color: T.red }}>DRINGEND</span>}
                        </div>
                        <div style={{ fontSize:12, color: T.textMd, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.titel}</div>
                        <div style={{ fontSize:11, color: T.textSm, marginTop:1 }}>{job.kunde}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                        {job.smsGesendet && (
                          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color: T.green, fontWeight:600 }}>
                            <MessageSquare size={11}/> SMS ✓
                          </span>
                        )}
                        <a
                          href={`tel:${job.telefon}`}
                          className="tel-btn"
                          onClick={e => e.stopPropagation()}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:9, backgroundColor: T.blueBg, border:`1px solid ${T.blueBd}`, color: T.blue, textDecoration:'none', flexShrink:0 }}
                        >
                          <Phone size={15}/>
                        </a>
                        <ChevronRight size={14} color={T.textSm}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isOpen && group.length === 0 && (
                <div style={{ padding:'16px', textAlign:'center', fontSize:12, color: T.textSm, borderTop:`1px solid ${T.border}` }}>Keine Aufträge</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16, backgroundColor:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} onClick={() => setSelected(null)}>
          <div style={{ background:T.surface, borderRadius:20, width:'100%', maxWidth:440, overflow:'hidden', boxShadow:T.shadowMd }} onClick={e => e.stopPropagation()}>
            <div style={{ height:4, backgroundColor: S[selected.status].color }} />
            <div style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:900, color:T.text, letterSpacing:'0.05em' }}>{selected.kennzeichen}</div>
                  <div style={{ fontSize:13, color:T.textMd, marginTop:3 }}>{selected.titel}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSm, padding:4 }}><X size={18}/></button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  { label:'Kunde',     value:selected.kunde },
                  { label:'Status',    value:<StatusBadge status={selected.status}/> },
                  { label:'Telefon',   value:selected.telefon },
                  { label:'Priorität', value: selected.priority==='urgent'?'🔴 Dringend':selected.priority==='high'?'🟠 Hoch':'✅ Normal' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:T.bg, borderRadius:10, padding:'10px 12px', border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:11, color:T.textSm, marginBottom:4, fontWeight:600 }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSm, marginBottom:8, letterSpacing:'0.08em' }}>STATUS ÄNDERN</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {ORDER.filter(s => s!==selected.status).map(s => (
                    <button key={s} onClick={() => { onChange(selected.id,s); setSelected(null); }} style={{
                      fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8, cursor:'pointer',
                      backgroundColor: S[s].bg, color: S[s].color, border:`1px solid ${S[s].border}`,
                    }}>
                      {S[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <a href={`tel:${selected.telefon}`} className="tel-btn" style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px',
                borderRadius:12, backgroundColor: T.blueBg, border:`1px solid ${T.blueBd}`,
                color: T.blue, textDecoration:'none', fontWeight:700, fontSize:14,
              }}>
                <Phone size={16}/> {selected.kunde} anrufen
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Termine-Tab ──────────────────────────────────────────────────────────────
function TermineTab({ onTerminToJob }: { onTerminToJob: () => void }) {
  const tage = [...new Set(TERMINE.map(t => t.tag))];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Info */}
      <div style={{ background: T.amberBg, border:`1px solid ${T.amberBd}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
        <Bell size={16} color={T.amber} style={{ flexShrink:0, marginTop:1 }} />
        <div>
          <div style={{ fontSize:13, fontWeight:700, color: T.amber, marginBottom:3 }}>So funktioniert der Workflow</div>
          <div style={{ fontSize:12, color: T.textMd, lineHeight:1.6 }}>
            Termin anlegen → Kunde kommt → <strong>„Auftrag erstellen"</strong> klicken → Fahrzeug erscheint automatisch im Kanban → SMS geht automatisch raus bei jedem Status
          </div>
        </div>
      </div>
      {/* Kalender */}
      {tage.map(tag => {
        const items = TERMINE.filter(t => t.tag === tag);
        const isHeute = items[0].heute;
        return (
          <div key={tag}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ fontWeight:700, fontSize:14, color: isHeute ? T.amber : T.text }}>{tag}</div>
              <div style={{ fontSize:12, color: T.textSm }}>{items[0].datum}</div>
              {isHeute && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:12, backgroundColor: T.amberBg, color: T.amber, border:`1px solid ${T.amberBd}` }}>Heute</span>}
              <div style={{ flex:1, height:1, backgroundColor: T.border }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {items.map(t => (
                <div key={t.id} style={{
                  background: T.surface, border: `1px solid ${isHeute ? T.amberBd : T.border}`,
                  borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:14,
                  boxShadow: T.shadow, borderLeft: `4px solid ${isHeute ? T.amber : T.border}`,
                }}>
                  <div style={{ minWidth:48, textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:800, color: isHeute ? T.amber : T.text }}>{t.uhrzeit}</div>
                    <div style={{ fontSize:10, color: T.textSm }}>Uhr</div>
                  </div>
                  <Avatar name={t.kunde} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color: T.text }}>{t.kunde}</div>
                    <div style={{ fontSize:12, color: T.textSm, marginTop:2 }}>
                      <span style={{ fontFamily:'monospace', fontWeight:700 }}>{t.kennzeichen}</span>
                      {' — '}{t.grund}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <a href={`tel:+49711111111`} className="tel-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:9, backgroundColor: T.blueBg, border:`1px solid ${T.blueBd}`, color: T.blue, textDecoration:'none' }}>
                      <Phone size={15}/>
                    </a>
                    {isHeute && (
                      <button onClick={onTerminToJob} style={{
                        display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:38,
                        borderRadius:9, backgroundColor: T.green, border:'none', color:'#fff',
                        fontSize:12, fontWeight:700, cursor:'pointer',
                      }}>
                        <Plus size={13}/> Auftrag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
type Tab = 'heute'|'auftraege'|'termine';

export function DemoDashboard() {
  const navigate  = useNavigate();
  const [jobs, setJobs] = useState<Job[]>(INIT);
  const [tab, setTab]   = useState<Tab>('heute');
  const [toast, setToast] = useState<string|null>(null);

  const onChange = (id:string, s:Status) => {
    setJobs(prev => prev.map(j => j.id===id ? { ...j, status:s, smsGesendet: s==='abholbereit'||s==='abgeholt' } : j));
    if (s === 'abholbereit') {
      setToast('📱 SMS an Kunde gesendet: „Ihr Fahrzeug ist abholbereit!"');
      setTimeout(() => setToast(null), 4000);
    }
  };

  const open        = jobs.filter(j => j.status !== 'abgeholt').length;
  const abholbereit = jobs.filter(j => j.status === 'abholbereit').length;
  const urgent      = jobs.filter(j => j.priority==='urgent' && j.status!=='abgeholt').length;

  const TABS: { key:Tab; label:string; icon:React.ElementType }[] = [
    { key:'heute',     label:'Heute',    icon: Clock },
    { key:'auftraege', label:'Aufträge', icon: List },
    { key:'termine',   label:'Termine',  icon: CalendarDays },
  ];

  return (
    <div style={{ minHeight:'100vh', backgroundColor: T.bg, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style>{`@media(min-width:768px){.tel-btn{display:none!important;}}`}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', zIndex:100, backgroundColor: T.green, color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:13, fontWeight:600, boxShadow:T.shadowMd, whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ backgroundColor: T.surface, borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, zIndex:40 }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, backgroundColor: T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wrench size={18} color="#000"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color: T.text, lineHeight:1.2 }}>Werkstatt-Pilot</div>
              <div style={{ fontSize:11, color: T.amber, fontWeight:600 }}>Muster KFZ Waiblingen</div>
            </div>
          </div>
          <button onClick={() => navigate('/register')} style={{
            display:'flex', alignItems:'center', gap:7, padding:'9px 16px',
            backgroundColor: T.amber, border:'none', borderRadius:10,
            fontSize:13, fontWeight:700, color:'#000', cursor:'pointer',
          }}>
            Kostenlos starten <ArrowRight size={14}/>
          </button>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:`1px solid ${T.border}` }}>
          {[
            { label:'Offene Aufträge', value:open,         color:T.amber, bg: T.amberBg },
            { label:'Abholbereit',     value:abholbereit,  color:T.green, bg: T.greenBg },
            { label:'Dringend',        value:urgent,       color:T.red,   bg: T.redBg   },
          ].map(({ label, value, color, bg }, i) => (
            <div key={label} style={{
              display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 8px',
              borderRight: i < 2 ? `1px solid ${T.border}` : undefined,
              backgroundColor: bg,
            }}>
              <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11, color: T.textSm, marginTop:3, fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', borderTop:`1px solid ${T.border}` }}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                padding:'11px 0', fontSize:13, fontWeight: active ? 700 : 500,
                color: active ? T.amber : T.textMd, border:'none', cursor:'pointer',
                backgroundColor:'transparent', borderBottom: active ? `2px solid ${T.amber}` : '2px solid transparent',
                transition:'all 0.15s',
              }}>
                <Icon size={15}/> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Demo Banner ── */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'16px 16px 0' }}>
        <div style={{ background: T.amberBg, border:`1px solid ${T.amberBd}`, borderRadius:12, padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20 }}>
          <p style={{ fontSize:13, color: T.textMd, margin:0 }}>
            <strong style={{ color: T.text }}>Demo-Modus</strong> — Karten verschieben, Status ändern, Anrufen testen
          </p>
          <button onClick={() => navigate('/register')} style={{ flexShrink:0, fontSize:12, fontWeight:700, padding:'7px 14px', borderRadius:8, backgroundColor: T.amber, border:'none', color:'#000', cursor:'pointer' }}>
            Meine Werkstatt anlegen
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ paddingBottom:40 }}>
          {tab === 'heute'     && <HeuteTab     jobs={jobs} onChange={onChange} />}
          {tab === 'auftraege' && <AuftraegeTab jobs={jobs} onChange={onChange} />}
          {tab === 'termine'   && <TermineTab onTerminToJob={() => { setTab('heute'); setToast('✅ Auftrag aus Termin erstellt!'); setTimeout(()=>setToast(null),3000); }} />}
        </div>
      </div>
    </div>
  );
}
