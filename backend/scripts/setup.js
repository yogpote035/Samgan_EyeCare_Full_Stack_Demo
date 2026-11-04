// Creates the database and tables from ../database/schema.sql using the DB_* values in .env
require('dotenv').config(); const fs = require('fs'), path = require('path');
(async () => { const c = await require('mysql2/promise').createConnection({ ...require('../src/db-config'), multipleStatements: true });
  await c.query(fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8')); console.log('Database schema created.'); await c.end(); })().catch(e => { console.error(e.message); process.exit(1); });
