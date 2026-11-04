const r = require('express').Router(), db = require('../db'), { ah, today } = require('../util'), { authenticate } = require('../auth');
r.get('/', authenticate, ah(async (req, res) => { const h = req.user.hid, d = today();
  const [[pc]] = await db.query('SELECT COUNT(*) n FROM patients WHERE hospital_id=?', [h]);
  const [st] = await db.query('SELECT status,COUNT(*) n FROM appointments WHERE hospital_id=? AND appt_date=? GROUP BY status', [h, d]);
  const [q] = await db.query("SELECT u.full_name doctor,a.token_no,p.name,a.status FROM appointments a JOIN users u ON u.id=a.doctor_id JOIN patients p ON p.id=a.patient_id WHERE a.hospital_id=? AND a.appt_date=? AND a.token_no IS NOT NULL ORDER BY u.full_name,a.token_no", [h, d]);
  const [act] = await db.query('SELECT l.action,l.detail,l.created_at,u.full_name FROM audit_logs l LEFT JOIN users u ON u.id=l.user_id WHERE l.hospital_id=? ORDER BY l.id DESC LIMIT 8', [h]);
  const by = Object.fromEntries(st.map(s => [s.status, s.n]));
  res.json({ totalPatients: pc.n, todayAppointments: st.reduce((a, s) => a + s.n, 0), waiting: by.Waiting || 0, inConsultation: by['In Consultation'] || 0, completed: by.Completed || 0, queue: q, recent: act }); }));
module.exports = r;
