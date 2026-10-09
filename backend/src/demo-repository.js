'use strict';
const { AppError } = require('./validation');
const { hashPassword } = require('./passwords');
const names = ['planos', 'clientes', 'faturas', 'chamados', 'usuarios'];

async function createDemoRepository() {
  const today = new Date().toISOString().slice(0, 10);
  const competence = today.slice(0, 7);
  const password = await hashPassword('ConnectNet#2026');
  let data = {
    planos: [
      { id: 1, nome: 'Fibra Essencial', velocidade: '300 Mbps', preco: '89.90', descricao: 'Conexão para a rotina da casa.' },
      { id: 2, nome: 'Fibra Família', velocidade: '500 Mbps', preco: '109.90', descricao: 'Mais velocidade para vários dispositivos.' },
      { id: 3, nome: 'Fibra Pro', velocidade: '700 Mbps', preco: '139.90', descricao: 'Plano para demandas intensivas.' },
    ],
    clientes: [
      { id: 1, nome: 'Ana Oliveira', email: 'cliente@connectnet.local', telefone: '89999990001', endereco: 'Rua das Flores, 120, Jerumenha', data_cadastro: today, status: 'ATIVO', plano_id: 2 },
      { id: 2, nome: 'Bruno Santos', email: 'bruno@example.test', telefone: '89999990002', endereco: 'Av. Principal, 85, Jerumenha', data_cadastro: today, status: 'ATIVO', plano_id: 1 },
      { id: 3, nome: 'Carla Lima', email: 'carla@example.test', telefone: '89999990003', endereco: 'Rua do Sol, 32, Jerumenha', data_cadastro: today, status: 'INATIVO', plano_id: 3 },
    ],
    usuarios: [
      { id: 1, nome: 'Administrador', email: 'admin@connectnet.local', senha_hash: password, perfil: 'ADMIN', cliente_id: null },
      { id: 2, nome: 'Equipe de suporte', email: 'suporte@connectnet.local', senha_hash: password, perfil: 'SUPORTE', cliente_id: null },
      { id: 3, nome: 'Ana Oliveira', email: 'cliente@connectnet.local', senha_hash: password, perfil: 'CLIENTE', cliente_id: 1 },
      { id: 4, nome: 'Bruno Santos', email: 'bruno@example.test', senha_hash: password, perfil: 'CLIENTE', cliente_id: 2 },
      { id: 5, nome: 'Carla Lima', email: 'carla@example.test', senha_hash: password, perfil: 'CLIENTE', cliente_id: 3 },
    ],
    faturas: [
      { id: 1, cliente_id: 1, competencia: competence, valor: '109.90', data_emissao: today, data_vencimento: `${competence}-20`, status: 'PENDENTE' },
      { id: 2, cliente_id: 2, competencia: competence, valor: '89.90', data_emissao: today, data_vencimento: `${competence}-20`, status: 'PAGA' },
    ],
    chamados: [
      { id: 1, cliente_id: 1, descricao: 'Conexão instável durante a noite.', data_abertura: today, status: 'ABERTO', prioridade: 'ALTA' },
      { id: 2, cliente_id: 2, descricao: 'Verificar posicionamento do roteador.', data_abertura: today, status: 'EM_ATENDIMENTO', prioridade: 'MEDIA' },
    ],
  };
  const counters = Object.fromEntries(names.map(name => [name, Math.max(0, ...data[name].map(row => row.id))]));
  function table(name) { if (!names.includes(name)) throw new Error('Tabela inválida.'); return data[name]; }
  function duplicate(name, value, except) {
    const rows = table(name).filter(row => row.id !== except);
    if ((name === 'clientes' || name === 'usuarios') && rows.some(row => row.email === value.email)) {
      throw new AppError(409, 'REGISTRO_DUPLICADO', 'Este e-mail já está cadastrado.');
    }
    if (name === 'faturas' && rows.some(row => row.cliente_id === value.cliente_id && row.competencia === value.competencia)) {
      throw new AppError(409, 'FATURA_DUPLICADA', 'Já existe uma fatura para este cliente nesta competência.');
    }
  }
  let queue = Promise.resolve();
  const repo = {
    mode: 'demo',
    async list(name) { return structuredClone(table(name)); },
    async get(name, id) { return structuredClone(table(name).find(row => row.id === id) || null); },
    async create(name, value) { duplicate(name, value); const row = { ...value, id: ++counters[name] }; table(name).push(row); return structuredClone(row); },
    async update(name, id, value) { const row = table(name).find(row => row.id === id); if (!row) return null; duplicate(name, { ...row, ...value }, id); Object.assign(row, value); return structuredClone(row); },
    async remove(name, id) { data[name] = table(name).filter(row => row.id !== id); },
    transaction(fn) {
      const operation = queue.then(async () => {
        const snapshot = structuredClone(data); const before = { ...counters };
        try { return await fn(repo); }
        catch (error) { data = snapshot; Object.assign(counters, before); throw error; }
      });
      queue = operation.catch(() => {});
      return operation;
    },
    async close() {},
  };
  return repo;
}
module.exports = { createDemoRepository };
