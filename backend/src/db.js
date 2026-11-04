require('dotenv').config();
module.exports = require('mysql2/promise').createPool({ ...require('./db-config'),
  database: process.env.DB_NAME || 'samgan_eyecare', waitForConnections: true, connectionLimit: 10, dateStrings: true });
