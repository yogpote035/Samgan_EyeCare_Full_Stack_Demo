require('dotenv').config(); const express = require('express'), cors = require('cors'), app = express();
const allowedOrigins = [...new Set([
  'https://samgan-eyecare-full-stack-demo.vercel.app',
  ...(process.env.CORS_ORIGIN || 'http://localhost:5173,https://frontend-ashy-ten-u59jrggaqx.vercel.app').split(',')
    .map(origin => origin.trim()).filter(Boolean)
])];
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) })); app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (q, s) => s.json({ ok: true }));
app.use('/api/auth', require('./routes/auth')); app.use('/api/patients', require('./routes/patients')); app.use('/api/appointments', require('./routes/appointments')); app.use('/api/dashboard', require('./routes/dashboard'));
app.use((q, s) => s.status(404).json({ error: 'Not found' }));
app.use((e, q, s, n) => { if (!e.status) console.error(e); s.status(e.status || 500).json({ error: e.status ? e.message : 'Server error', ...(e.extra || {}) }); });
module.exports = app;
