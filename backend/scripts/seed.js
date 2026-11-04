// Fictional demo data. Run after db:setup. Demo password for every user: demo123
const bcrypt = require('bcrypt'), db = require('../src/db');
const D = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
(async () => {
  const hash = await bcrypt.hash('demo123', 10), ids = {};
  for (const [code, name] of [['DDH', 'Dr. Divekar Hospital (Demo)'], ['DEMO2', 'Second Demo Eye Clinic']]) { const [r] = await db.query('INSERT INTO hospitals(code,name) VALUES(?,?)', [code, name]); ids[code] = r.insertId; }
  const U = [['admin', 'Admin (Demo)', 'Hospital Admin'], ['reception', 'Reception (Demo)', 'Receptionist'], ['optometrist', 'Optometrist (Demo)', 'Optometrist'], ['doctor', 'Dr. Divekar (Demo)', 'Doctor'], ['doctor2', 'Dr. Demo Associate', 'Doctor'], ['billing', 'Billing (Demo)', 'Billing Executive']], uid = {};
  for (const [u, n, r] of U) { const [x] = await db.query('INSERT INTO users(hospital_id,username,password_hash,full_name,role) VALUES(?,?,?,?,?)', [ids.DDH, u, hash, n, r]); uid[u] = x.insertId; }
  await db.query("INSERT INTO users(hospital_id,username,password_hash,full_name,role) VALUES(?,?,?,?,'Receptionist')", [ids.DEMO2, 'reception', hash, 'Reception (Clinic 2)']);
  const P = 'Ramesh Kale|62|M,Sunita Pawar|55|F,Amol Deshmukh|34|M,Priya Joshi|28|F,Vitthal Shinde|71|M,Kavita More|45|F,Rahul Gaikwad|19|M,Meena Thorat|66|F,Sanjay Wagh|50|M,Anita Bhosale|38|F'.split(','), pid = [];
  await db.query('INSERT INTO uhid_counters(hospital_id,last_no) VALUES(?,?)', [ids.DDH, P.length]);
  for (const [i, s] of P.entries()) { const [n, a, x] = s.split('|'); const [r] = await db.query('INSERT INTO patients(hospital_id,uhid,name,age,sex,mobile,address,registered_on,created_by) VALUES(?,?,?,?,?,?,?,?,?)', [ids.DDH, 'SEC-' + String(i + 1).padStart(5, '0'), n, +a, x, '98000000' + String(i + 1).padStart(2, '0'), 'Sangamner, Maharashtra (demo)', D(-i * 3 - 5), uid.reception]); pid.push(r.insertId); }
  await db.query("INSERT INTO uhid_counters(hospital_id,last_no) VALUES(?,1)", [ids.DEMO2]);
  await db.query("INSERT INTO patients(hospital_id,uhid,name,age,sex,mobile,registered_on) VALUES(?,?,?,?,?,?,?)", [ids.DEMO2, 'SEC-00001', 'Other Clinic Patient', 40, 'M', '9700000001', D(0)]);
  const A = [[3, 'doctor', '09:30', 'New', 'Waiting', 1], [4, 'doctor', '09:45', 'Regular', 'Waiting', 2], [5, 'doctor', '10:00', 'New', 'In Consultation', 3], [6, 'doctor', '11:30', 'New', 'Booked', null], [7, 'doctor', '12:00', 'Follow-up', 'Booked', null], [8, 'doctor', '09:00', 'Regular', 'Completed', 4], [9, 'doctor2', '10:15', 'New', 'Waiting', 1]];
  for (const [p, d, t, ty, st, tk] of A) await db.query('INSERT INTO appointments(hospital_id,patient_id,doctor_id,appt_date,appt_time,type,status,token_no,checked_in_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)', [ids.DDH, pid[p], uid[d], D(0), t, ty, st, tk, tk ? new Date() : null, uid.reception]);
  console.log('Seeded. Hospital code DDH, users: admin, reception, optometrist, doctor, doctor2, billing (password demo123). Second hospital code DEMO2 (user reception).'); await db.end(); })().catch(e => { console.error(e.message); process.exit(1); });
