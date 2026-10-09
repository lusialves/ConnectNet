'use strict';
const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { createTestRepository } = require('./repository.cjs');
const { createMysqlRepository } = require('../backend/src/mysql-repository');
const { setup } = require('../backend/scripts/setup-db');
const { config } = require('../backend/src/config');

describe('Integridade e persistência MySQL', () => {
  let repo, connection;
  beforeEach(async () => {
    repo = await createTestRepository('mysql');
    connection = await mysql.createConnection({ ...repo.testDb, dateStrings: true });
  });
  afterEach(async () => { if (connection) await connection.end(); if (repo) await repo.close(); connection = repo = null; });
  const rejects = (operation, code) => assert.rejects(operation, error => error.code === code);

  test('as cinco tabelas usam InnoDB e utf8mb4 em um servidor MySQL real', async () => {
    const [[server]] = await connection.query('SELECT VERSION() AS version, @@version_comment AS comment');
    assert.ok(Number(server.version.split('.')[0]) >= 8); assert.doesNotMatch(server.version + server.comment, /MariaDB/i);
    const [tables] = await connection.execute('SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [repo.testDb.database]);
    assert.deepEqual(tables.map(row => row.TABLE_NAME).sort(), ['chamado','cliente','fatura','plano','usuario']);
    assert.ok(tables.every(row => row.ENGINE === 'InnoDB' && row.TABLE_COLLATION.startsWith('utf8mb4')));
  });

  test('chaves estrangeiras rejeitam referências inexistentes', async () => {
    await rejects(connection.execute('UPDATE cliente SET plano_id = ? WHERE id = ?', [999999, 1]), 'ER_NO_REFERENCED_ROW_2');
    await rejects(connection.execute('UPDATE fatura SET cliente_id = ? WHERE id = ?', [999999, 1]), 'ER_NO_REFERENCED_ROW_2');
    await rejects(connection.execute('UPDATE chamado SET cliente_id = ? WHERE id = ?', [999999, 1]), 'ER_NO_REFERENCED_ROW_2');
  });

  test('exclusões preservam histórico e removem a conta de um cliente sem vínculos', async () => {
    await rejects(connection.execute('DELETE FROM plano WHERE id = ?', [1]), 'ER_ROW_IS_REFERENCED_2');
    await rejects(connection.execute('DELETE FROM cliente WHERE id = ?', [1]), 'ER_ROW_IS_REFERENCED_2');
    await connection.execute('DELETE FROM cliente WHERE id = ?', [3]);
    const [users] = await connection.execute('SELECT id FROM usuario WHERE cliente_id = ?', [3]);
    assert.equal(users.length, 0);
  });

  test('índices únicos impedem e-mails e competências duplicados', async () => {
    await rejects(connection.execute('UPDATE cliente SET email = ? WHERE id = ?', ['cliente@connectnet.local', 2]), 'ER_DUP_ENTRY');
    await rejects(connection.execute('UPDATE usuario SET email = ? WHERE id = ?', ['admin@connectnet.local', 2]), 'ER_DUP_ENTRY');
    const invoice = await repo.get('faturas', 1); delete invoice.id;
    await rejects(repo.create('faturas', invoice), 'ER_DUP_ENTRY');
  });

  test('CHECK rejeita preços e valores inválidos e vínculo incompatível com o perfil', async () => {
    await rejects(connection.execute('UPDATE plano SET preco = 0 WHERE id = 1'), 'ER_CHECK_CONSTRAINT_VIOLATED');
    await rejects(connection.execute('UPDATE fatura SET valor = -1 WHERE id = 1'), 'ER_CHECK_CONSTRAINT_VIOLATED');
    await rejects(connection.execute("UPDATE usuario SET perfil = 'CLIENTE' WHERE id = 1"), 'ER_CHECK_CONSTRAINT_VIOLATED');
  });

  test('DECIMAL e DATE são recuperados sem perda e texto parametrizado permanece literal', async () => {
    const descricao = "Conexão 😀 '); DROP TABLE cliente; --";
    const plan = await repo.create('planos', { nome: 'Fibra São João', velocidade: '100 Mbps', preco: '10.10', descricao });
    assert.equal(plan.preco, '10.10'); assert.equal(plan.descricao, descricao);
    assert.match((await repo.get('clientes', 1)).data_cadastro, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal((await repo.list('clientes')).length, 3);
  });

  test('rollback desfaz gravações quando a transação falha', async () => {
    await assert.rejects(repo.transaction(async tx => {
      await tx.create('planos', { nome: 'Plano a desfazer', velocidade: '100 Mbps', preco: '10.00', descricao: '' });
      throw new Error('Falha controlada após a gravação');
    }), /Falha controlada/);
    assert.equal((await repo.list('planos')).length, 3);
  });

  test('executar o setup novamente preserva registros e senhas existentes', async () => {
    const hash = (await repo.get('usuarios', 1)).senha_hash;
    const plan = await repo.create('planos', { nome: 'Plano persistente', velocidade: '200 Mbps', preco: '19.90', descricao: 'Criado antes do segundo setup' });
    await setup(config({ db: repo.testDb }), { seedPassword: 'SenhaDiferente#2026', log() {} });
    assert.equal((await repo.list('planos')).length, 4);
    assert.equal((await repo.get('planos', plan.id)).nome, 'Plano persistente');
    assert.equal((await repo.get('usuarios', 1)).senha_hash, hash);
    assert.equal((await repo.list('usuarios')).length, 5);
  });

  test('os dados permanecem após fechar e reabrir as conexões da aplicação', async () => {
    let application = await createMysqlRepository(repo.testDb);
    const plan = await application.create('planos', { nome: 'Plano após reinício', velocidade: '250 Mbps', preco: '59.90', descricao: '' });
    await application.close();
    application = await createMysqlRepository(repo.testDb);
    try { assert.deepEqual(await application.get('planos', plan.id), plan); }
    finally { await application.close(); }
  });
});
