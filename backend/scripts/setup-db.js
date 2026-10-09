'use strict';
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { config } = require('../src/config');
const { createDemoRepository } = require('../src/demo-repository');
const { hashPassword } = require('../src/passwords');

async function setup(settings = config(), { seedPassword = process.env.SEED_PASSWORD || 'ConnectNet#2026', log = console.log } = {}) {
  const { database, ...connectionOptions } = settings.db;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(database)) throw new Error('DB_NAME inválido.');
  const connection = await mysql.createConnection(connectionOptions);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${database}\``);
    const sql = fs.readFileSync(path.join(settings.root, 'database/schema.sql'), 'utf8');
    for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean)) await connection.query(statement);
    const [counts] = await connection.query('SELECT (SELECT COUNT(*) FROM plano) + (SELECT COUNT(*) FROM cliente) + (SELECT COUNT(*) FROM usuario) AS total');
    if (Number(counts[0].total) > 0) { log('Estrutura conferida. Os dados existentes foram preservados; nenhum seed foi inserido.'); return; }
    const repo = await createDemoRepository();
    const senha_hash = await hashPassword(seedPassword);
    const names = { planos: 'plano', clientes: 'cliente', usuarios: 'usuario', faturas: 'fatura', chamados: 'chamado' };
    await connection.beginTransaction();
    try {
      for (const [name, table] of Object.entries(names)) {
        for (const row of await repo.list(name)) {
          if (name === 'usuarios') row.senha_hash = senha_hash;
          const keys = Object.keys(row);
          await connection.execute(`INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(key => row[key]));
        }
      }
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    log(`Schema ${database} criado e dados de exemplo inseridos. Altere DB_MODE para mysql no .env.`);
  } finally { await connection.end(); }
}
if (require.main === module) setup().catch(error => { console.error('Falha no setup:', error.message); process.exitCode = 1; });
module.exports = { setup };
