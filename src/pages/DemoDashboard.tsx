import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Phone, Clock, CalendarDays, List,
  ChevronRight, ChevronDown, Plus,
  MessageSquare, ArrowRight, X, Bell,
} from 'lucide-react';

// ─── Apple-style theme ────────────────────────────────────────────────────────
const T = {
  bg:       '#f5f5f7',   // Apple background gray
  surface:  '#ffffff',
  text:     '#1d1d1f',   // Apple near-black
  textMd:   '#6e6e73',   // Apple secondary
  textSm:   '#86868b',   // Apple tertiary
  amber:    '#ff9500',   // Apple orange/amber
  green:    '#34c759',   // Apple green
  blue:     '#007aff',   // Apple blue
  red:      '#ff3b30',   // Apple red
  orange:   '#ff6b00',
  purple:   '#af52de',   // Apple purple
  yellow:   '#ffcc00',   // Apple yellow
  gray:     '#8e8e93',
  shadow:   '0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
  shadowLg: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'annahme'|'diagnose'|'teile_bestellt'|'teile_da'|'reparatur'|'abholbereit'|'abgeholt';
type Priority = 'normal'|'high'|'urgent';

interface Job {
  id: string; kennzeichen: string; kunde: string; telefon: string;
  titel: string; status: Status; priority: Priority; uhrzeit?: string; smsGesendet?: boolean;
}

// ─── Status-Konfiguration — nur Farbe und Label ───────────────────────────────
const S: Record<Status, { label: string; color: string }> = {
  annahme:        { label: 'Annahme',         color: T.blue   },
  diagnose:       { label: 'Diagnose',        color: T.yellow },
  teile_bestellt: { label: 'Teile bestellt',  color: T.orange },
  teile_da:       { label: 'Teile da',        color: T.purple },
  reparatur:      { label: 'In Reparatur',    color: T.red    },
  abholbereit:    { label: 'Abholbereit',     color: T.green  },
  abgeholt:       { label: 'Abgeholt',        color: T.gray   },
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
  { id:'t1', tag:'Montag',    datum:'24.03.', uhrzeit:'08:00', kunde:'Frank Bauer',    kennzeichen:'S-FB 110',  grund:'Inspektion + TÜV',  heute:true  },
  { id:'t2', tag:'Montag',    datum:'24.03.', uhrzeit:'10:30', kunde:'Erika Vogel',    kennzeichen:'WN-EV 44',  grund:'Bremsen hinten',    heute:true  },
  { id:'t3', tag:'Montag',    datum:'24.03.', uhrzeit:'14:00', kunde:'Stefan Lenz',    kennzeichen:'S-SL 778',  grund:'Ölwechsel',         heute:true  },
  { id:'t4', tag:'Dienstag',  datum:'25.03.', uhrzeit:'08:00', kunde:'Monika Klein',   kennzeichen:'ES-MK 99',  grund:'Klimaanlage',       heute:false },
  { id:'t5', tag:'Dienstag',  datum:'25.03.', uhrzeit:'11:00', kunde:'Rainer Schulz',  kennzeichen:'WN-RS 555', grund:'Zahnriemen',        heute:false },
  { id:'t6', tag:'Mittwoch',  datum:'26.03.', uhrzeit:'09:00', kunde:'Carla Müller',   kennzeichen:'S-CM 321',  grund:'Fehlerdiagnose',    heute:false },
  { id:'t7', tag:'Donnerstag',datum:'27.03.', uhrzeit:'08:30', kunde:'Ahmed Hassan',   kennzeichen:'S-AH 77',   grund:'Reifenwechsel',     heute:false },
  { id:'t8', tag:'Freitag',   datum:'28.03.', uhrzeit:'10:00', kunde:'Lisa Neumann',   kennzeichen:'ES-LN 12',  grund:'Inspektion',        heute:false },
];

// ─── Nächster Schritt ─────────────────────────────────────────────────────────
const NEXT: Partial<Record<Status, { status: Status; label: string; color: string }>> = {
  annahme:        { status:'diagnose',       label:'Diagnose starten',       color: T.yellow },
  diagnose:       { status:'teile_bestellt', label:'Teile bestellen',        color: T.orange },
  teile_bestellt: { status:'teile_da',       label:'Teile eingetroffen',     color: T.purple },
  teile_da:       { status:'reparatur',      label:'Reparatur starten',      color: T.red    },
  reparatur:      { status:'abholbereit',    label:'Fertig — Abholbereit',   color: T.green  },
  abholbereit:    { status:'abgeholt',       label:'Abgeholt',               color: T.gray   },
};

const SORT_ORDER: Status[] = ['abholbereit','reparatur','teile_da','teile_bestellt','diagnose','annahme','abgeholt'];

// ─── Mechaniker-Karte (Apple-Style) ───────────────────────────────────────────
function MechCard({ job, onNext }: { job: Job; onNext: (s: Status) => void }) {
  const { color, label } = S[job.status];
  const next = NEXT[job.status];
  const done = job.status === 'abgeholt';

  return (
    <div style={{
      background: T.surface,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: done ? 'none' : T.shadow,
      opacity: done ? 0.4 : 1,
      border: done ? `1px solid rgba(0,0,0,0.06)` : 'none',
    }}>
      <div style={{ padding: '20px 20px 18px' }}>

        {/* Zeile 1: Kennzeichen + Dringend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.04em', lineHeight: 1,
          }}>
            {job.kennzeichen}
          </span>
          {job.priority === 'urgent' && !done && (
            <span style={{ fontSize: 12, fontWeight: 600, color: T.red }}>Dringend</span>
          )}
          {job.priority === 'high' && !done && (
            <span style={{ fontSize: 12, fontWeight: 600, color: T.orange }}>Priorität</span>
          )}
        </div>

        {/* Zeile 2: Aufgabe */}
        <div style={{ fontSize: 16, fontWeight: 500, color: T.text, marginBottom: 10, lineHeight: 1.3 }}>
          {job.titel}
        </div>

        {/* Zeile 3: Status-Dot + Kunde */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.textMd, fontWeight: 500 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {job.smsGesendet && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.green, fontWeight: 500 }}>
                <MessageSquare size={11} /> SMS
              </span>
            )}
            <span style={{ fontSize: 13, color: T.textSm }}>{job.kunde}</span>
          </div>
        </div>
      </div>

      {/* Action-Button */}
      {next && !done && (
        <button
          onClick={() => onNext(next.status)}
          style={{
            width: '100%', minHeight: 56,
            background: next.color === T.yellow ? '#fff8e6' : `${next.color}15`,
            border: 'none', borderTop: `1px solid rgba(0,0,0,0.06)`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: next.color === T.yellow ? '#a16207' : next.color,
            fontSize: 15, fontWeight: 600, transition: 'opacity 0.12s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          {next.label}
          <ChevronRight size={17} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ─── Heute-Tab ────────────────────────────────────────────────────────────────
function HeuteTab({ jobs, onChange }: { jobs: Job[]; onChange: (id:string, s:Status)=>void }) {
  const priorityWeight = (p: Priority) => p === 'urgent' ? 0 : p === 'high' ? 1 : 2;
  const sorted = [...jobs].sort((a, b) => {
    const si = SORT_ORDER.indexOf(a.status) - SORT_ORDER.indexOf(b.status);
    return si !== 0 ? si : priorityWeight(a.priority) - priorityWeight(b.priority);
  });
  const open   = sorted.filter(j => j.status !== 'abgeholt');
  const closed = sorted.filter(j => j.status === 'abgeholt');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {open.map(j => <MechCard key={j.id} job={j} onNext={s => onChange(j.id, s)} />)}
      {closed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12, color: T.textSm, textAlign: 'center', marginBottom: 10, letterSpacing: '0.05em' }}>
            HEUTE ABGEHOLT · {closed.length}
          </p>
          {closed.map(j => <MechCard key={j.id} job={j} onNext={s => onChange(j.id, s)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Aufträge-Tab ─────────────────────────────────────────────────────────────
function AuftraegeTab({ jobs, onChange }: { jobs:Job[]; onChange:(id:string,s:Status)=>void }) {
  const [selected, setSelected] = useState<Job|null>(null);
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({});
  const toggle = (s: Status) => setCollapsed(p => ({ ...p, [s]: !p[s] }));
  const activeStatuses = ORDER.filter(s => jobs.some(j => j.status === s));

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
        {activeStatuses.map(s => {
          const group = jobs.filter(j => j.status === s);
          const { color, label } = S[s];
          const isOpen = !collapsed[s];
          return (
            <div key={s} style={{ background: T.surface, borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow }}>
              <button
                onClick={() => toggle(s)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:'none', border:'none', cursor:'pointer' }}
              >
                <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor: color, display:'inline-block', flexShrink:0 }} />
                <span style={{ fontSize:15, fontWeight:600, color: T.text, flex:1, textAlign:'left' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:500, color: T.textSm, marginRight: 6 }}>{group.length}</span>
                {isOpen ? <ChevronDown size={15} color={T.textSm}/> : <ChevronRight size={15} color={T.textSm}/>}
              </button>

              {isOpen && group.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {group.map((job, idx) => (
                    <div
                      key={job.id}
                      onClick={() => setSelected(job)}
                      style={{
                        display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                        borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.05)' : undefined,
                        cursor:'pointer', transition:'background 0.1s',
                        borderLeft: `3px solid ${color}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.bg)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                          <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:700, fontSize:14, color: T.text, letterSpacing:'0.04em' }}>{job.kennzeichen}</span>
                          {job.priority === 'urgent' && <span style={{ fontSize:11, fontWeight:600, color: T.red }}>Dringend</span>}
                        </div>
                        <div style={{ fontSize:13, color: T.textMd, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.titel}</div>
                        <div style={{ fontSize:12, color: T.textSm, marginTop:2 }}>{job.kunde}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                        {job.smsGesendet && <MessageSquare size={13} color={T.green}/>}
                        <a href={`tel:${job.telefon}`} className="tel-btn" onClick={e => e.stopPropagation()}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:10, background: T.bg, color: T.blue, textDecoration:'none' }}>
                          <Phone size={14}/>
                        </a>
                        <ChevronRight size={13} color={T.textSm}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail-Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16, backgroundColor:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)' }} onClick={() => setSelected(null)}>
          <div style={{ background:T.surface, borderRadius:24, width:'100%', maxWidth:440, overflow:'hidden', boxShadow:T.shadowLg }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'20px 20px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:'ui-monospace,monospace', fontSize:26, fontWeight:700, color:T.text, letterSpacing:'0.04em' }}>{selected.kennzeichen}</div>
                  <div style={{ fontSize:15, color:T.textMd, marginTop:4 }}>{selected.titel}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:`${T.bg}`, border:'none', cursor:'pointer', color:T.textSm, padding:8, borderRadius:20, marginTop:-4 }}>
                  <X size={16}/>
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  { label:'Kunde',     value:selected.kunde   },
                  { label:'Status',    value:<span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:S[selected.status].color, display:'inline-block' }}/>{S[selected.status].label}</span> },
                  { label:'Priorität', value: selected.priority==='urgent'?'Dringend':selected.priority==='high'?'Hoch':'Normal' },
                  { label:'Telefon',   value:selected.telefon },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:T.bg, borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:T.textSm, marginBottom:4, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:T.textSm, marginBottom:8, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em' }}>Status ändern</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {ORDER.filter(s => s!==selected.status).map(s => (
                    <button key={s} onClick={() => { onChange(selected.id,s); setSelected(null); }} style={{
                      fontSize:13, fontWeight:500, padding:'7px 14px', borderRadius:20, cursor:'pointer',
                      background:T.bg, color:S[s].color, border:'none',
                    }}>
                      {S[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <a href={`tel:${selected.telefon}`} className="tel-btn" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px',
              borderTop:'1px solid rgba(0,0,0,0.06)', color: T.blue, textDecoration:'none',
              fontWeight:600, fontSize:15,
            }}>
              <Phone size={16}/> {selected.kunde} anrufen
            </a>
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
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background:T.surface, borderRadius:16, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:12, boxShadow:T.shadow }}>
        <Bell size={15} color={T.amber} style={{ flexShrink:0, marginTop:2 }} />
        <div style={{ fontSize:13, color:T.textMd, lineHeight:1.6 }}>
          Termin anlegen → Kunde kommt → <strong style={{ color:T.text }}>„Auftrag erstellen"</strong> → Fahrzeug erscheint im Kanban → SMS bei jedem Status
        </div>
      </div>

      {tage.map(tag => {
        const items = TERMINE.filter(t => t.tag === tag);
        const isHeute = items[0].heute;
        return (
          <div key={tag}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700, color: isHeute ? T.amber : T.text }}>{tag}</span>
              <span style={{ fontSize:12, color:T.textSm }}>{items[0].datum}</span>
              {isHeute && <span style={{ fontSize:11, fontWeight:600, color:T.amber }}>Heute</span>}
              <div style={{ flex:1, height:'1px', background:'rgba(0,0,0,0.08)' }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {items.map(t => (
                <div key={t.id} style={{
                  background:T.surface, borderRadius:16, padding:'14px 18px',
                  display:'flex', alignItems:'center', gap:14, boxShadow:T.shadow,
                  borderLeft:`3px solid ${isHeute ? T.amber : 'rgba(0,0,0,0.08)'}`,
                }}>
                  <div style={{ minWidth:46, textAlign:'center' }}>
                    <div style={{ fontSize:15, fontWeight:700, color: isHeute ? T.amber : T.text }}>{t.uhrzeit}</div>
                    <div style={{ fontSize:10, color:T.textSm }}>Uhr</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{t.kunde}</div>
                    <div style={{ fontSize:12, color:T.textSm, marginTop:2 }}>
                      <span style={{ fontFamily:'ui-monospace,monospace', fontWeight:600 }}>{t.kennzeichen}</span> · {t.grund}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <a href="tel:+49711000000" className="tel-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:T.bg, color:T.blue, textDecoration:'none' }}>
                      <Phone size={14}/>
                    </a>
                    {isHeute && (
                      <button onClick={onTerminToJob} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px', height:36, borderRadius:10, background:T.green, border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
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

// ─── Quick-Capture Modal ──────────────────────────────────────────────────────
function QuickCapture({
  jobs, onClose, onCreate,
}: {
  jobs: Job[];
  onClose: () => void;
  onCreate: (kenn: string, name: string, tel: string) => void;
}) {
  const [kenn, setKenn]   = useState('');
  const [name, setName]   = useState('');
  const [tel,  setTel]    = useState('');
  const [autofilled, setAutofilled] = useState(false);

  const handleKennChange = (v: string) => {
    const upper = v.toUpperCase();
    setKenn(upper);
    // Autofill aus bestehendem Kunden
    const match = jobs.find(j => j.kennzeichen.replace(/\s/g,'') === upper.replace(/\s/g,''));
    if (match) {
      setName(match.kunde);
      setTel(match.telefon);
      setAutofilled(true);
    } else if (autofilled) {
      setName('');
      setTel('');
      setAutofilled(false);
    }
  };

  const valid = kenn.trim().length >= 3 && name.trim().length >= 2;

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16, backgroundColor:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)' }}
      onClick={onClose}
    >
      <div
        style={{ background:T.surface, borderRadius:24, width:'100%', maxWidth:440, overflow:'hidden', boxShadow:T.shadowLg }}
        onClick={e => e.stopPropagation()}
      >
        {/* Titel */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 16px' }}>
          <span style={{ fontSize:17, fontWeight:700, color:T.text }}>Neuer Auftrag</span>
          <button onClick={onClose} style={{ background:T.bg, border:'none', cursor:'pointer', color:T.textSm, padding:'6px 8px', borderRadius:20 }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          {/* Kennzeichen */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.textSm, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
              Kennzeichen
            </label>
            <input
              autoFocus
              value={kenn}
              onChange={e => handleKennChange(e.target.value)}
              placeholder="S-AB 1234"
              style={{
                width:'100%', boxSizing:'border-box', padding:'14px 16px',
                fontFamily:'ui-monospace,"SF Mono",monospace', fontSize:22, fontWeight:700,
                color:T.text, background:T.bg, border:'none', borderRadius:14,
                letterSpacing:'0.06em', outline:'none',
              }}
            />
            {autofilled && (
              <div style={{ fontSize:12, color:T.green, marginTop:5, fontWeight:500 }}>
                ✓ Kunde aus bestehendem Auftrag erkannt
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.textSm, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
              Kundenname
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Max Mustermann"
              style={{
                width:'100%', boxSizing:'border-box', padding:'12px 16px', fontSize:15, fontWeight:500,
                color:T.text, background:autofilled ? '#f0fdf4' : T.bg, border:'none', borderRadius:14, outline:'none',
              }}
            />
          </div>

          {/* Telefon */}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:T.textSm, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
              Telefon
            </label>
            <input
              value={tel}
              onChange={e => setTel(e.target.value)}
              placeholder="+49 711 ..."
              type="tel"
              style={{
                width:'100%', boxSizing:'border-box', padding:'12px 16px', fontSize:15, fontWeight:500,
                color:T.text, background:autofilled ? '#f0fdf4' : T.bg, border:'none', borderRadius:14, outline:'none',
              }}
            />
          </div>

          {/* Erstellen */}
          <button
            disabled={!valid}
            onClick={() => onCreate(kenn.trim(), name.trim(), tel.trim())}
            style={{
              width:'100%', minHeight:52, marginTop:4,
              background: valid ? T.blue : T.bg,
              border:'none', borderRadius:16, cursor: valid ? 'pointer' : 'not-allowed',
              color: valid ? '#fff' : T.textSm,
              fontSize:15, fontWeight:700, transition:'opacity 0.12s',
            }}
          >
            Auftrag erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
type Tab = 'heute'|'auftraege'|'termine';

export function DemoDashboard() {
  const navigate  = useNavigate();
  const [jobs, setJobs]       = useState<Job[]>(INIT);
  const [tab, setTab]         = useState<Tab>('heute');
  const [toast, setToast]     = useState<string|null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [nextId, setNextId]   = useState(100);

  const onChange = (id:string, s:Status) => {
    setJobs(prev => prev.map(j => j.id===id ? { ...j, status:s, smsGesendet: s==='abholbereit'||s==='abgeholt' } : j));
    if (s === 'abholbereit') {
      setToast('💬 WhatsApp gesendet: „Ihr Fahrzeug ist abholbereit!"');
      setTimeout(() => setToast(null), 4000);
    }
  };

  const onCreateJob = (kenn: string, name: string, tel: string) => {
    const newJob: Job = {
      id: String(nextId),
      kennzeichen: kenn,
      kunde: name || 'Unbekannt',
      telefon: tel || '',
      titel: 'Neu aufgenommen',
      status: 'annahme',
      priority: 'normal',
      uhrzeit: new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' }),
    };
    setJobs(prev => [newJob, ...prev]);
    setNextId(n => n + 1);
    setShowCapture(false);
    setTab('heute');
    setToast(`Auftrag ${kenn} erstellt`);
    setTimeout(() => setToast(null), 3000);
  };

  const open        = jobs.filter(j => j.status !== 'abgeholt').length;
  const abholbereit = jobs.filter(j => j.status === 'abholbereit').length;
  const urgent      = jobs.filter(j => j.priority==='urgent' && j.status!=='abgeholt').length;

  const TABS: { key:Tab; label:string; icon:React.ElementType }[] = [
    { key:'heute',     label:'Heute',    icon: Clock       },
    { key:'auftraege', label:'Aufträge', icon: List        },
    { key:'termine',   label:'Termine',  icon: CalendarDays },
  ];

  return (
    <div style={{ minHeight:'100vh', backgroundColor: T.bg, fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif' }}>
      <style>{`@media(min-width:768px){.tel-btn{display:none!important;}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:100, backgroundColor:'rgba(0,0,0,0.8)', backdropFilter:'blur(12px)', color:'#fff', padding:'12px 20px', borderRadius:40, fontSize:13, fontWeight:500, boxShadow:T.shadowLg, whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,0,0,0.06)', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, backgroundColor: T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wrench size={17} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color: T.text, lineHeight:1.2 }}>Werkstatt-Pilot</div>
              <div style={{ fontSize:11, color: T.textSm }}>Muster KFZ Waiblingen</div>
            </div>
          </div>
          <button onClick={() => navigate('/register')} style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
            backgroundColor: T.blue, border:'none', borderRadius:20,
            fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer',
          }}>
            Kostenlos starten <ArrowRight size={13}/>
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
          {[
            { label:'Offen',       value:open,        color:T.text  },
            { label:'Abholbereit', value:abholbereit,  color:T.green },
            { label:'Dringend',    value:urgent,       color:T.red   },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 8px', borderRight: i<2 ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
              <div style={{ fontSize:24, fontWeight:700, color, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11, color:T.textSm, marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'11px 0', fontSize:13, fontWeight: active ? 600 : 400,
                color: active ? T.amber : T.textSm,
                border:'none', cursor:'pointer', background:'transparent',
                borderBottom: active ? `2px solid ${T.amber}` : '2px solid transparent',
                transition:'all 0.15s',
              }}>
                <Icon size={14}/> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo-Banner */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'16px 20px 0' }}>
        <div style={{ background:'rgba(255,149,0,0.08)', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:16 }}>
          <p style={{ fontSize:13, color:T.textMd, margin:0 }}>
            <strong style={{ color:T.text }}>Demo</strong> — Status ändern, Aktionen ausprobieren
          </p>
          <button onClick={() => navigate('/register')} style={{ flexShrink:0, fontSize:12, fontWeight:600, padding:'7px 14px', borderRadius:20, backgroundColor:T.amber, border:'none', color:'#fff', cursor:'pointer' }}>
            Eigene Werkstatt anlegen
          </button>
        </div>

        {/* Content */}
        <div style={{ paddingBottom:96 }}>
          {tab === 'heute'     && <HeuteTab     jobs={jobs} onChange={onChange} />}
          {tab === 'auftraege' && <AuftraegeTab jobs={jobs} onChange={onChange} />}
          {tab === 'termine'   && <TermineTab   onTerminToJob={() => { setTab('heute'); setToast('Auftrag aus Termin erstellt'); setTimeout(()=>setToast(null),3000); }} />}
        </div>
      </div>

      {/* Floating Quick-Capture Button */}
      <button
        onClick={() => setShowCapture(true)}
        title="Neuer Auftrag"
        style={{
          position:'fixed', bottom:28, right:24, zIndex:50,
          width:58, height:58, borderRadius:'50%',
          backgroundColor:T.blue, border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 6px 24px rgba(0,122,255,0.4)',
          transition:'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,122,255,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(0,122,255,0.4)'; }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5}/>
      </button>

      {/* Quick-Capture Modal */}
      {showCapture && (
        <QuickCapture
          jobs={jobs}
          onClose={() => setShowCapture(false)}
          onCreate={onCreateJob}
        />
      )}
    </div>
  );
}
