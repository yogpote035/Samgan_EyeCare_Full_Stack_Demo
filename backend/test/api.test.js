// Run with: npm test  (needs MySQL with schema + seed loaded). Checks login, roles, duplicates, tokens and hospital isolation.
const { test, before, after } = require('node:test'), assert = require('node:assert/strict'), app = require('../src/app'), db = require('../src/db');
let base, srv; const tok = {};
const api = async (m, p, t, b) => { const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, j: await r.json() }; };
const login = async (code, username) => (await api('POST', '/api/auth/login', null, { code, username, password: 'demo123' })).j.token;
before(async () => { await db.query("DELETE FROM appointments WHERE appt_date='2030-01-15'"); await db.query("DELETE FROM patients WHERE mobile='9822222222'"); srv = app.listen(0); base = 'http://localhost:' + srv.address().port; for (const u of ['reception', 'optometrist', 'doctor', 'admin']) tok[u] = await login('DDH', u); tok.other = await login('DEMO2', 'reception'); });
after(async () => { srv.close(); await db.end(); });
test('login rejects a wrong password and accepts the right one', async () => { assert.equal((await api('POST', '/api/auth/login', null, { code: 'DDH', username: 'doctor', password: 'x' })).s, 401); assert.ok(tok.doctor); });
test('protected API needs a token', async () => assert.equal((await api('GET', '/api/patients')).s, 401));
test('optometrist cannot register a patient (backend role check)', async () => assert.equal((await api('POST', '/api/patients', tok.optometrist, { name: 'Test Role', age: 30, sex: 'M', mobile: '9811111111' })).s, 403));
let pid, uhid;
test('register patient, UHID generated, duplicate mobile warned then forced', async () => {
  const b = { name: 'Test Patient One', age: 41, sex: 'F', mobile: '9822222222' }, r = await api('POST', '/api/patients', tok.reception, b); assert.equal(r.s, 201); assert.match(r.j.uhid, /^SEC-\d{5}$/); pid = r.j.id; uhid = r.j.uhid;
  const d = await api('POST', '/api/patients', tok.reception, b); assert.equal(d.s, 409); assert.equal(d.j.duplicates.length, 1);
  const f = await api('POST', '/api/patients', tok.reception, { ...b, force: true }); assert.equal(f.s, 201); assert.notEqual(f.j.uhid, uhid); });
test('invalid patient data is rejected', async () => { assert.equal((await api('POST', '/api/patients', tok.reception, { name: 'A', age: 200, sex: 'M', mobile: '123' })).s, 400); });
test('search by UHID, name and mobile', async () => { for (const q of [uhid, 'Test Patient One', '9822222222']) assert.ok((await api('GET', '/api/patients?q=' + encodeURIComponent(q), tok.reception)).j.some(p => p.id == pid)); });
test('booking does not check in; check-in creates sequential tokens per doctor/day', async () => {
  const doc = (await api('GET', '/api/appointments/doctors', tok.reception)).j.find(d => d.full_name.includes('Associate')), day = '2030-01-15';
  const a = await api('POST', '/api/appointments', tok.reception, { patientId: pid, doctorId: doc.id, date: day, time: '10:00', type: 'New' }); assert.equal(a.s, 201); assert.equal(a.j.token, null);
  const b = await api('POST', '/api/appointments', tok.reception, { patientId: pid, doctorId: doc.id, date: day, time: '10:30', type: 'Regular', checkIn: true }); assert.equal(b.j.token, 1);
  const c = await api('POST', `/api/appointments/${a.j.id}/checkin`, tok.reception); assert.equal(c.j.token, 2);
  assert.equal((await api('POST', `/api/appointments/${a.j.id}/checkin`, tok.reception)).s, 409); });
test('hospital isolation: another hospital cannot read or use these records', async () => {
  assert.equal((await api('GET', '/api/patients/' + pid, tok.other)).s, 404);
  assert.equal((await api('GET', '/api/patients?q=Test', tok.other)).j.length, 0);
  const [[d]] = await db.query("SELECT u.id FROM users u JOIN hospitals h ON h.id=u.hospital_id WHERE h.code='DDH' AND u.username='doctor'");
  assert.equal((await api('POST', '/api/appointments', tok.other, { patientId: pid, doctorId: d.id, date: '2030-01-15', time: '11:00', type: 'New' })).s, 404); });
test('dashboard numbers come from MySQL', async () => { const d = (await api('GET', '/api/dashboard', tok.doctor)).j; assert.ok(d.totalPatients >= 10); assert.equal(d.waiting, 3); });
test('database refuses a cross-hospital link even if the API were bypassed', async () => {
  const [[o]] = await db.query("SELECT p.id,p.hospital_id FROM patients p JOIN hospitals h ON h.id=p.hospital_id WHERE h.code='DEMO2' LIMIT 1"), [[d]] = await db.query("SELECT u.id,u.hospital_id FROM users u JOIN hospitals h ON h.id=u.hospital_id WHERE h.code='DDH' AND u.username='doctor'");
  await assert.rejects(db.query("INSERT INTO appointments(hospital_id,patient_id,doctor_id,appt_date,appt_time,type) VALUES(?,?,?,'2030-01-01','10:00','New')", [d.hospital_id, o.id, d.id])); });
