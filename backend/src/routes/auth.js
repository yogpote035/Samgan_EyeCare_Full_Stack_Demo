const r = require('express').Router(), bcrypt = require('bcrypt'), rate = require('express-rate-limit'), db = require('../db'), { ah, fail, audit } = require('../util'), { sign, authenticate } = require('../auth');
r.post('/login', rate({ windowMs: 15 * 60 * 1000, limit: +process.env.LOGIN_LIMIT || 50, standardHeaders: true, legacyHeaders: false }), ah(async (req, res) => {
  const { code, username, password } = req.body || {};
  if (!code || !username || !password) throw fail(400, 'Hospital code, username and password are required');
  const [[u]] = await db.query('SELECT u.*,h.name hospital FROM users u JOIN hospitals h ON h.id=u.hospital_id WHERE h.code=? AND u.username=? AND u.active=1', [String(code).toUpperCase(), String(username).toLowerCase()]);
  if (!u || !(await bcrypt.compare(String(password), u.password_hash))) throw fail(401, 'Invalid hospital code, username or password');
  await audit(db, { hid: u.hospital_id, id: u.id }, 'LOGIN', 'user', u.id);
  res.json({ token: sign(u), user: { id: u.id, name: u.full_name, role: u.role, hospital: u.hospital } });
}));
r.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
module.exports = r;
