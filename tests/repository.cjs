'use strict';
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const { config } = require('../backend/src/config');
const { setup } = require('../backend/scripts/setup-db');
const { createDemoRepository } = require('../backend/src/demo-repository');
const { createMysqlRepository } = require('../backend/src/mysql-repository');

// Cada teste MySQL cria seu próprio banco. Apenas esse banco é removido.
async function createTestRepository(mode = process.env.CONNECTNET_TEST_MODE || 'demo') {
  if (mode === 'demo') return createDemoRepository();
  if (mode !== 'mysql') throw new Error('CONNECTNET_TEST_MODE deve ser demo ou mysql.');
  const settings = config({ mode: 'mysql' });
  const database = `connectnet_test_${randomUUID().replaceAll('-', '')}`;
  const { database: ignored, ...connectionOptions } = settings.db;
  const admin = await mysql.createConnection(connectionOptions);
  let owned = false;
  let repo;
  async function cleanup() {
    try { if (owned) await admin.query(`DROP DATABASE \`${database}\``); }
    finally { await admin.end(); }
  }
  try {
    await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    owned = true;
    settings.db = { ...settings.db, database };
    await setup(settings, { seedPassword: 'ConnectNet#2026', log() {} });
    repo = await createMysqlRepository(settings.db);
    const close = repo.close.bind(repo);
    repo.testDb = settings.db;
    repo.close = async () => { try { await close(); } finally { await cleanup(); } };
    return repo;
  } catch (error) { await cleanup(); throw error; }
}
module.exports = { createTestRepository };
