import { useEffect, useState, useCallback } from 'react'; import api, { errMsg } from './api.js';
const today = () => new Date().toLocaleDateString('en-CA'), fd = s => s ? s.slice(0, 10).split('-').reverse().join('/') : '–';
const badge = s => <span className={'bd ' + ({ Waiting: 'a', 'In Consultation': 'b', Completed: 'g', Booked: '' }[s] || '')}>{s}</span>;
const Stat = ({ n, l }) => <div className="card st"><b>{n}</b><span>{l}</span></div>;
export function Dashboard() {
  const [d, setD] = useState(null), [e, setE] = useState('');
  useEffect(() => { api.get('/dashboard').then(r => setD(r.data)).catch(x => setE(errMsg(x))); }, []);
  if (e) return <p className="er">{e}</p>; if (!d) return <p className="mu">Loading…</p>;
  const docs = [...new Set(d.queue.map(q => q.doctor))];
  return <><h2>Dashboard</h2><div className="g4"><Stat n={d.totalPatients} l="Registered patients" /><Stat n={d.todayAppointments} l="Today’s appointments" /><Stat n={d.waiting} l="Waiting" /><Stat n={d.inConsultation} l="In consultation" /><Stat n={d.completed} l="Completed" /></div>
    <p className="mu sm">Collection, pending payments and follow-ups appear here once the billing and follow-up modules are built (next stage).</p>
    <div className="g2"><div className="card"><h3>Doctor-wise queue (today)</h3>{docs.length ? docs.map(n => <div key={n}><b>{n}</b><table><tbody>{d.queue.filter(q => q.doctor === n).map((q, i) => <tr key={i}><td>Token {q.token_no}</td><td>{q.name}</td><td>{badge(q.status)}</td></tr>)}</tbody></table></div>) : <p className="mu">No checked-in patients yet.</p>}</div>
      <div className="card"><h3>Recent activity</h3>{d.recent.map((r, i) => <div key={i} className="sm">{r.created_at.slice(11, 16)} · {r.full_name || '–'} · {r.action} {r.detail || ''}</div>)}</div></div></>;
}
export function Reception({ user }) {
  const [docs, setDocs] = useState([]), [list, setList] = useState([]), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [dups, setDups] = useState(null);
  const [f, setF] = useState({ name: '', age: '', sex: 'M', mobile: '', address: '' }), [b, setB] = useState({ book: true, doctorId: '', type: 'New', date: today(), time: '10:00', checkIn: true });
  const load = useCallback(() => api.get('/appointments?date=' + today()).then(r => setList(r.data)), []);
  useEffect(() => { api.get('/appointments/doctors').then(r => { setDocs(r.data); setB(x => ({ ...x, doctorId: r.data[0]?.id || '' })); }); load(); }, [load]);
  const can = ['Receptionist', 'Hospital Admin'].includes(user.role);
  const save = async force => { setErr(''); setMsg(''); setDups(null);
    try { const { data: p } = await api.post('/patients', { ...f, force }); let t = '';
      if (b.book) { const { data: a } = await api.post('/appointments', { patientId: p.id, ...b, source: b.checkIn ? 'Walk-in' : 'Reception' }); t = a.token ? ' – checked in, token ' + a.token : ' – appointment booked'; }
      setMsg(`${p.name} registered, UHID ${p.uhid}${t}`); setF({ name: '', age: '', sex: 'M', mobile: '', address: '' }); load();
    } catch (x) { if (x.response?.status === 409) setDups(x.response.data.duplicates); else setErr(errMsg(x)); } };
  const ci = async id => { try { const { data } = await api.post(`/appointments/${id}/checkin`); setMsg('Checked in – token ' + data.token); load(); } catch (x) { setErr(errMsg(x)); } };
  return <><h2>Reception</h2>{msg && <div className="ok">{msg}</div>}{err && <p className="er">{err}</p>}
    <div className="g2">{can && <div className="card"><h3>Register patient</h3>
      <label>Full name</label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /><div className="row"><div><label>Age</label><input type="number" value={f.age} onChange={e => setF({ ...f, age: e.target.value })} /></div><div><label>Gender</label><select value={f.sex} onChange={e => setF({ ...f, sex: e.target.value })}><option>M</option><option>F</option><option>Other</option></select></div></div>
      <label>Mobile (10 digits)</label><input value={f.mobile} maxLength={10} onChange={e => setF({ ...f, mobile: e.target.value })} /><label>Address</label><input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
      <label className="chk"><input type="checkbox" checked={b.book} onChange={e => setB({ ...b, book: e.target.checked })} /> Book appointment now</label>
      {b.book && <><div className="row"><div><label>Doctor</label><select value={b.doctorId} onChange={e => setB({ ...b, doctorId: +e.target.value })}>{docs.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div><div><label>Type</label><select value={b.type} onChange={e => setB({ ...b, type: e.target.value })}><option>New</option><option>Regular</option><option>Follow-up</option></select></div></div>
        <div className="row"><div><label>Date</label><input type="date" value={b.date} onChange={e => setB({ ...b, date: e.target.value })} /></div><div><label>Time</label><input type="time" value={b.time} onChange={e => setB({ ...b, time: e.target.value })} /></div></div>
        <label className="chk"><input type="checkbox" checked={b.checkIn} onChange={e => setB({ ...b, checkIn: e.target.checked })} /> Walk-in: check in now (creates token)</label></>}
      {dups && <div className="warn">Possible duplicate: {dups.map(d => `${d.name} (${d.uhid})`).join(', ')} already uses this mobile.<br /><button className="btn s" onClick={() => save(true)}>Register anyway</button></div>}
      <p><button className="btn" onClick={() => save(false)}>Register</button></p></div>}
      <div className="card"><h3>Today’s appointments</h3><div className="tw"><table><thead><tr><th>Time</th><th>Token</th><th>Patient</th><th>UHID</th><th>Doctor</th><th>Status</th><th /></tr></thead><tbody>
        {list.map(a => <tr key={a.id}><td>{a.appt_time.slice(0, 5)}</td><td>{a.token_no || '–'}</td><td>{a.name}</td><td>{a.uhid}</td><td>{a.doctor}</td><td>{badge(a.status)}</td><td>{can && ['Booked', 'Confirmed'].includes(a.status) && <button className="btn s" onClick={() => ci(a.id)}>Check in</button>}</td></tr>)}</tbody></table>{!list.length && <p className="mu">No appointments today.</p>}</div></div></div></>;
}
export function Patients() {
  const [q, setQ] = useState(''), [rows, setRows] = useState([]), [p, setP] = useState(null);
  useEffect(() => { const t = setTimeout(() => api.get('/patients', { params: { q } }).then(r => setRows(r.data)), 250); return () => clearTimeout(t); }, [q]);
  if (p) return <><button className="btn s" onClick={() => setP(null)}>← Back</button><div className="card"><h3>{p.name} · {p.uhid}</h3>{p.age} yrs · {p.sex} · {p.mobile} · {p.address || '–'} · Registered {fd(p.registered_on)}</div>
    <div className="card"><h3>Appointments &amp; visits</h3><table><tbody>{p.appointments.map(a => <tr key={a.id}><td>{fd(a.appt_date)} {a.appt_time.slice(0, 5)}</td><td>{a.type}</td><td>{a.doctor}</td><td>Token {a.token_no || '–'}</td><td>{badge(a.status)}</td></tr>)}</tbody></table>{!p.appointments.length && <p className="mu">No appointments yet.</p>}</div></>;
  return <><h2>Patients</h2><div className="card"><input placeholder="Search by name, UHID or mobile" value={q} onChange={e => setQ(e.target.value)} /><div className="tw"><table><thead><tr><th>UHID</th><th>Name</th><th>Age/Sex</th><th>Mobile</th><th /></tr></thead><tbody>
    {rows.map(r => <tr key={r.id}><td>{r.uhid}</td><td>{r.name}</td><td>{r.age}/{r.sex}</td><td>{r.mobile}</td><td><button className="btn s" onClick={() => api.get('/patients/' + r.id).then(x => setP(x.data))}>Open</button></td></tr>)}</tbody></table></div></div></>;
}
