const jwt = require('jsonwebtoken'), db = require('./db'), { ah, fail } = require('./util');
const secret = () => { if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set'); return process.env.JWT_SECRET; };
exports.sign = u => jwt.sign({ uid: u.id, hid: u.hospital_id }, secret(), { expiresIn: '8h' });
// Tenant (hospital) and role always come from the database row of the token's user – never from the request body.
exports.authenticate = ah(async (req, res, next) => {
  const t = (req.headers.authorization || '').replace(/^Bearer /, ''); let p;
  try { p = jwt.verify(t, secret()); } catch (e) { throw fail(401, 'Please log in again'); }
  const [[u]] = await db.query('SELECT id,hospital_id,role,full_name,active FROM users WHERE id=? AND hospital_id=?', [p.uid, p.hid]);
  if (!u || !u.active) throw fail(401, 'Account not available');
  req.user = { id: u.id, hid: u.hospital_id, role: u.role, name: u.full_name }; next();
});
exports.allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : next(fail(403, 'Your role cannot do this'));
