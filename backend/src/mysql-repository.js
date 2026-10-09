'use strict';
const mysql = require('mysql2/promise');
const tables = { planos: 'plano', clientes: 'cliente', faturas: 'fatura', chamados: 'chamado', usuarios: 'usuario' };
const columns = {
  planos: ['nome', 'velocidade', 'preco', 'descricao'],
  clientes: ['nome', 'email', 'telefone', 'endereco', 'data_cadastro', 'status', 'plano_id'],
  faturas: ['cliente_id', 'competencia', 'valor', 'data_emissao', 'data_vencimento', 'status'],
  chamados: ['cliente_id', 'descricao', 'data_abertura', 'status', 'prioridade'],
  usuarios: ['nome', 'email', 'senha_hash', 'perfil', 'cliente_id'],
};
function table(name) { if (!Object.hasOwn(tables, name)) throw new Error('Tabela inválida.'); return tables[name]; }
function checkedFields(name, value) {
  const keys = Object.keys(value);
  if (!keys.length || keys.some(key => !columns[name]?.includes(key))) throw new Error('Coluna inválida.');
  return keys;
}
function repository(executor, pool) {
  const repo = {
    mode: 'mysql',
    async list(name) { const [rows] = await executor.execute(`SELECT * FROM \`${table(name)}\` ORDER BY id DESC`); return rows; },
    async get(name, id) { const [rows] = await executor.execute(`SELECT * FROM \`${table(name)}\` WHERE id = ?`, [id]); return rows[0] || null; },
    async create(name, value) {
      const keys = checkedFields(name, value);
      const [result] = await executor.execute(`INSERT INTO \`${table(name)}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(key => value[key]));
      return repo.get(name, result.insertId);
    },
    async update(name, id, value) {
      const keys = checkedFields(name, value);
      await executor.execute(`UPDATE \`${table(name)}\` SET ${keys.map(k => `\`${k}\` = ?`).join(',')} WHERE id = ?`, [...keys.map(key => value[key]), id]);
      return repo.get(name, id);
    },
    async remove(name, id) { await executor.execute(`DELETE FROM \`${table(name)}\` WHERE id = ?`, [id]); },
    async transaction(fn) {
      if (!pool) return fn(repo);
      const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const result = await fn(repository(connection)); await connection.commit(); return result; }
      catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    },
    async close() { if (pool) await pool.end(); },
  };
  return repo;
}
async function createMysqlRepository(db) {
  const pool = mysql.createPool({ ...db, waitForConnections: true, connectionLimit: 5, dateStrings: true, charset: 'utf8mb4' });
  try { await pool.execute('SELECT 1'); }
  catch (error) { await pool.end(); throw error; }
  return repository(pool, pool);
}
module.exports = { createMysqlRepository };
