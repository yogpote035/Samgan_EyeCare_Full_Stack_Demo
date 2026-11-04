import { useState } from 'react'; import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, LogOut, Eye } from 'lucide-react'; import api, { errMsg } from './api.js'; import { Dashboard, Reception, Patients } from './pages.jsx';
const NAV = [['/', 'Dashboard', LayoutDashboard, null], ['/reception', 'Reception', ClipboardList, ['Receptionist', 'Hospital Admin']], ['/patients', 'Patients', Users, null]];
const getUser = () => { try { return JSON.parse(localStorage.getItem('sec_user')); } catch { return null; } };
function Login({ onLogin }) {
  const nav = useNavigate(), [f, setF] = useState({ code: 'DDH', username: '', password: '' }), [err, setErr] = useState('');
  const go = async e => { e.preventDefault(); try { const { data } = await api.post('/auth/login', f); localStorage.setItem('sec_token', data.token); localStorage.setItem('sec_user', JSON.stringify(data.user)); onLogin(data.user); nav('/'); } catch (x) { setErr(errMsg(x)); } };
  return <div className="login"><form className="card lc" onSubmit={go}><h1><Eye size={26} /> Samgan EyeCare</h1><p className="mu">One Intelligent Digital Platform for Complete Eye-Care Practice</p><span className="demo">DEMO – fictional data</span>
    <label>Hospital code</label><input value={f.code} onChange={e => setF({ ...f, code: e.target.value })} /><label>Username</label><input value={f.username} onChange={e => setF({ ...f, username: e.target.value })} autoFocus />
    <label>Password</label><input type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />{err && <p className="er">{err}</p>}<button className="btn">Login</button>
    <p className="mu sm">Demo users: admin, reception, optometrist, doctor, billing · password demo123</p></form></div>;
}
function Shell({ user, children, onLogout }) {
  const nav = useNavigate(), out = () => { localStorage.removeItem('sec_token'); localStorage.removeItem('sec_user'); onLogout(); nav('/login'); };
  return <div className="app"><aside><div className="lg"><Eye size={20} /> Samgan EyeCare</div>{NAV.filter(n => !n[3] || n[3].includes(user.role)).map(([to, l, I]) => <NavLink key={to} to={to} end={to === '/'}><I size={18} /> {l}</NavLink>)}</aside>
    <main><div className="top"><span className="demo">DEMO</span><span className="grow" /><span>{user.name} · {user.role} · {user.hospital}</span><button className="btn s" onClick={out}><LogOut size={15} /> Logout</button></div><div className="pg">{children}</div></main></div>;
}
export default function App() {
  const [user, setUser] = useState(getUser), P = el => user && localStorage.getItem('sec_token') ? <Shell user={user} onLogout={() => setUser(null)}>{el}</Shell> : <Navigate to="/login" />;
  return <Routes><Route path="/login" element={<Login onLogin={setUser} />} /><Route path="/" element={P(<Dashboard />)} /><Route path="/reception" element={P(<Reception user={user} />)} /><Route path="/patients" element={P(<Patients />)} /><Route path="*" element={<Navigate to="/" />} /></Routes>;
}
