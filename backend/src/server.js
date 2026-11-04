const app = require('./app'), db = require('./db'), port = process.env.PORT || 5000;
db.query('SELECT 1').then(() => app.listen(port, () => console.log('Samgan EyeCare API on http://localhost:' + port + ' – MySQL connected')))
  .catch(e => { console.error('MySQL connection failed:', e.message); process.exit(1); });
