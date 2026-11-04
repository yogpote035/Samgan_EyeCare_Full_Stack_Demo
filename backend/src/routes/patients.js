const r = require('express').Router(), db = require('../db'), { ah, fail, audit, tx, today } = require('../util'), { authenticate, allow } = require('../auth');
r.use(authenticate);
const check = b => { const n = String(b.name || '').trim(), a = +b.age, m = String(b.mobile || '');
  if (n.length < 2) throw fail(400, 'Name is required'); if (!(a >= 0 && a <= 120)) throw fail(400, 'Enter a valid age'); if (!['M', 'F', 'Other'].includes(b.sex)) throw fail(400, 'Select gender');
  if (!/^[6-9]\d{9}$/.test(m)) throw fail(400, 'Enter a valid 10-digit mobile number'); return { n, a, m, ad: String(b.address || '').slice(0, 255) }; };
r.post('/', allow('Receptionist', 'Hospital Admin'), ah(async (req, res) => {
  const v = check(req.body), [dup] = await db.query('SELECT id,uhid,name FROM patients WHERE hospital_id=? AND mobile=? LIMIT 3', [req.user.hid, v.m]);
  if (dup.length && !req.body.force) throw fail(409, 'Possible duplicate patient (same mobile number)', { duplicates: dup });
  const p = await tx(async c => {
    await c.query('INSERT INTO uhid_counters(hospital_id,last_no) VALUES(?,0) ON DUPLICATE KEY UPDATE hospital_id=hospital_id', [req.user.hid]);
    const [[k]] = await c.query('SELECT last_no FROM uhid_counters WHERE hospital_id=? FOR UPDATE', [req.user.hid]), no = k.last_no + 1, uhid = 'SEC-' + String(no).padStart(5, '0');
    await c.query('UPDATE uhid_counters SET last_no=? WHERE hospital_id=?', [no, req.user.hid]);
    const [i] = await c.query('INSERT INTO patients(hospital_id,uhid,name,age,sex,mobile,address,registered_on,created_by) VALUES(?,?,?,?,?,?,?,?,?)', [req.user.hid, uhid, v.n, v.a, req.body.sex, v.m, v.ad, today(), req.user.id]);
    await audit(c, req.user, 'PATIENT_REGISTER', 'patient', i.insertId, uhid); return { id: i.insertId, uhid, name: v.n };
  });
  res.status(201).json(p);
}));
r.get('/', ah(async (req, res) => { const q = '%' + String(req.query.q || '').trim() + '%';
  const [rows] = await db.query('SELECT id,uhid,name,age,sex,mobile,registered_on FROM patients WHERE hospital_id=? AND (name LIKE ? OR uhid LIKE ? OR mobile LIKE ?) ORDER BY id DESC LIMIT 50', [req.user.hid, q, q, q]); res.json(rows); }));
r.get('/:id', ah(async (req, res) => {
  const [[p]] = await db.query('SELECT * FROM patients WHERE id=? AND hospital_id=?', [req.params.id, req.user.hid]); if (!p) throw fail(404, 'Patient not found');
  const [appts] = await db.query('SELECT a.id,a.appt_date,a.appt_time,a.type,a.status,a.token_no,u.full_name doctor FROM appointments a JOIN users u ON u.id=a.doctor_id WHERE a.patient_id=? AND a.hospital_id=? ORDER BY a.appt_date DESC,a.appt_time DESC', [p.id, req.user.hid]);
  res.json({ ...p, appointments: appts }); }));
module.exports = r;
