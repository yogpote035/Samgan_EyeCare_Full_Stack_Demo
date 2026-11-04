const host = process.env.DB_HOST || 'localhost';
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(host.toLowerCase());

module.exports = {
  host,
  port: +process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: isLocalHost ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true }
};
