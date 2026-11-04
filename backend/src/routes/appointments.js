const r = require('express').Router(), db = require('../db'), { ah, fail, audit, tx, today } = require('../util'), { authenticate, allow } = require('../auth');
r.use(authenticate);
r.get('/doctors', ah(async (req, res) => { const [d] = await db.query("SELECT id,full_name FROM users WHERE hospital_id=? AND role='Doctor' AND active=1 ORDER BY full_name", [req.user.hid]); res.json(d); }));
r.get('/', ah(async (req, res) => { const d = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : today();
  const [rows] = await db.query('SELECT a.id,a.appt_time,a.type,a.status,a.token_no,p.id patient_id,p.uhid,p.name,p.age,u.full_name doctor FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=a.doctor_id WHERE a.hospital_id=? AND a.appt_date=? ORDER BY a.appt_time', [req.user.hid, d]); res.json(rows); }));
const checkIn = async (c, u, id) => {
  const [[a]] = await c.query('SELECT id,doctor_id,appt_date,status FROM appointments WHERE id=? AND hospital_id=? FOR UPDATE', [id, u.hid]); if (!a) throw fail(404, 'Appointment not found');
  if (!['Booked', 'Confirmed'].includes(a.status)) throw fail(409, 'Patient is already checked in or the appointment is closed');
  const [[t]] = await c.query('SELECT COALESCE(MAX(token_no),0)+1 n FROM appointments WHERE hospital_id=? AND doctor_id=? AND appt_date=?', [u.hid, a.doctor_id, a.appt_date]);
  await c.query("UPDATE appointments SET status='Waiting',token_no=?,checked_in_at=NOW() WHERE id=?", [t.n, id]); await audit(c, u, 'CHECK_IN', 'appointment', id, 'token ' + t.n); return t.n; };
r.post('/', allow('Receptionist', 'Hospital Admin'), ah(async (req, res) => {
  const b = req.body, types = ['New', 'Regular', 'Follow-up'], src = ['Reception', 'Phone', 'Walk-in'];
  if (!types.includes(b.type) || !/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || !/^\d{2}:\d{2}/.test(b.time || '')) throw fail(400, 'Type, date and time are required');
  const out = await tx(async c => {
    const [[p]] = await c.query('SELECT id FROM patients WHERE id=? AND hospital_id=?', [b.patientId, req.user.hid]); if (!p) throw fail(404, 'Patient not found');
    const [[d]] = await c.query("SELECT id FROM users WHERE id=? AND hospital_id=? AND role='Doctor' AND active=1", [b.doctorId, req.user.hid]); if (!d) throw fail(404, 'Doctor not found');
    const [i] = await c.query('INSERT INTO appointments(hospital_id,patient_id,doctor_id,appt_date,appt_time,type,source,remarks,created_by) VALUES(?,?,?,?,?,?,?,?,?)', [req.user.hid, p.id, d.id, b.date, b.time, b.type, src.includes(b.source) ? b.source : 'Reception', String(b.remarks || '').slice(0, 255), req.user.id]);
    await audit(c, req.user, 'APPT_BOOK', 'appointment', i.insertId); const token = b.checkIn ? await checkIn(c, req.user, i.insertId) : null; return { id: i.insertId, token }; });
  res.status(201).json(out); }));
r.post('/:id/checkin', allow('Receptionist', 'Hospital Admin'), ah(async (req, res) => res.json({ token: await tx(c => checkIn(c, req.user, req.params.id)) })));
module.exports = r;
