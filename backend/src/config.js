'use strict';
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '../..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

function config(overrides = {}) {
  const result = {
    root,
    port: Number(process.env.PORT || 3000),
    mode: process.env.DB_MODE || 'demo',
    secureCookie: process.env.COOKIE_SECURE === 'true',
    sessionHours: Number(process.env.SESSION_HOURS || 8),
    host: process.env.HOST || '127.0.0.1',
    db: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'connectnet_entrega3',
    },
    ...overrides,
  };
  if (!['demo', 'mysql'].includes(result.mode)) throw new Error('DB_MODE deve ser demo ou mysql.');
  if (!Number.isFinite(result.sessionHours) || result.sessionHours <= 0 || result.sessionHours > 24) {
    throw new Error('SESSION_HOURS deve estar entre 0 e 24.');
  }
  return result;
}
module.exports = { config };
