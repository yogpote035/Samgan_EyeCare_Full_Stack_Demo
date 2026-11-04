const db = require('./db');
exports.ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.fail = (status, message, extra) => Object.assign(new Error(message), { status, extra });
exports.audit = (conn, u, action, entity, id, detail) => conn.query('INSERT INTO audit_logs(hospital_id,user_id,action,entity,entity_id,detail) VALUES(?,?,?,?,?,?)', [u.hid, u.id, action, entity, id, detail || null]);
exports.tx = async fn => { const c = await db.getConnection(); try { await c.beginTransaction(); const r = await fn(c); await c.commit(); return r; } catch (e) { await c.rollback(); throw e; } finally { c.release(); } };
exports.today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
