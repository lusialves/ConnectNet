'use strict';
const v = require('./validation');
const { hashPassword } = require('./passwords');
const { owner } = require('./auth');
const today = () => new Date().toISOString().slice(0, 10);
const clientFields = {
  nome: value => v.text(value, 'Nome', 2, 150), email: v.email,
  telefone: value => v.text(value, 'Telefone', 8, 20), endereco: value => v.text(value, 'Endereço', 5, 255),
  plano_id: value => v.id(value, 'Plano'), status: value => v.choice(value, v.statuses.cliente, 'Status'),
};
const planFields = {
  nome: value => v.text(value, 'Nome do plano', 2, 100), velocidade: value => v.text(value, 'Velocidade', 2, 50),
  preco: value => v.money(value, 'Preço'), descricao: value => v.text(value, 'Descrição', 0, 500),
};
function bodyObject(body) { if (!body || typeof body !== 'object' || Array.isArray(body)) v.fail('Envie um objeto JSON.'); return body; }
async function found(repo, name, id) {
  const row = await repo.get(name, id);
  if (!row) throw new v.AppError(404, 'NAO_ENCONTRADO', 'Registro não encontrado.');
  return row;
}
function moneyOutput(row) {
  const result = { ...row }; if (result.preco !== undefined) result.preco = Number(result.preco); if (result.valor !== undefined) result.valor = Number(result.valor); return result;
}
function required(body, fields) {
  bodyObject(body);
  return Object.fromEntries(Object.entries(fields).map(([name, validator]) => [name, validator(body[name])]));
}
function filter(rows, query, statuses) {
  const q = query.q === undefined ? '' : v.text(query.q, 'Busca', 0, 120).toLocaleLowerCase('pt-BR');
  const status = query.status ? v.choice(query.status, statuses, 'Filtro de status') : null;
  return rows.filter(row => (!status || row.status === status) && (!q || [row.nome, row.email, row.cliente_nome, row.descricao, row.competencia].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q)));
}
function createServices(repo) {
  async function decorated(name, user, query = {}) {
    let rows = await repo.list(name);
    if (user.perfil === 'CLIENTE' && ['faturas', 'chamados'].includes(name)) rows = rows.filter(row => row.cliente_id === user.cliente_id);
    if (name === 'clientes') {
      const plans = await repo.list('planos');
      rows = rows.map(row => ({ ...row, plano_nome: plans.find(plan => plan.id === row.plano_id)?.nome || '' }));
    }
    if (['faturas', 'chamados'].includes(name)) {
      const clients = await repo.list('clientes');
      rows = rows.map(row => ({ ...row, cliente_nome: clients.find(client => client.id === row.cliente_id)?.nome || '' }));
    }
    return filter(rows, query, v.statuses[name.slice(0, -1)] || []).map(moneyOutput).sort((a, b) => b.id - a.id);
  }
  return {
    list: decorated,
    async get(name, id, user) {
      const row = await found(repo, name, id);
      if (name === 'clientes') owner({ user }, { cliente_id: row.id });
      else if (['faturas', 'chamados'].includes(name)) owner({ user }, row);
      return moneyOutput(row);
    },
    async createPlan(body) {
      const value = required(body, { nome: planFields.nome, velocidade: planFields.velocidade, preco: planFields.preco });
      value.descricao = planFields.descricao(body.descricao || '');
      return moneyOutput(await repo.transaction(tx => tx.create('planos', value)));
    },
    async updatePlan(id, body) {
      const value = v.patch(body, planFields);
      return repo.transaction(async tx => { await found(tx, 'planos', id); return moneyOutput(await tx.update('planos', id, value)); });
    },
    async createClient(body) {
      const value = required(body, { nome: clientFields.nome, email: clientFields.email, telefone: clientFields.telefone, endereco: clientFields.endereco, plano_id: clientFields.plano_id });
      value.status = v.choice(body.status || 'ATIVO', v.statuses.cliente, 'Status'); value.data_cadastro = today();
      const senha_hash = await hashPassword(v.password(body.senha));
      return repo.transaction(async tx => {
        await found(tx, 'planos', value.plano_id);
        const client = await tx.create('clientes', value);
        await tx.create('usuarios', { nome: value.nome, email: value.email, senha_hash, perfil: 'CLIENTE', cliente_id: client.id });
        return client;
      });
    },
    async updateClient(id, body) {
      const value = v.patch(body, { ...clientFields, senha: v.password });
      const senha_hash = value.senha ? await hashPassword(value.senha) : null;
      delete value.senha;
      return repo.transaction(async tx => {
        await found(tx, 'clientes', id);
        if (value.plano_id) await found(tx, 'planos', value.plano_id);
        const client = Object.keys(value).length ? await tx.update('clientes', id, value) : await tx.get('clientes', id);
        const user = (await tx.list('usuarios')).find(row => row.cliente_id === id);
        if (!user) throw new v.AppError(409, 'CONTA_AUSENTE', 'O cliente não possui conta de acesso.');
        await tx.update('usuarios', user.id, { nome: client.nome, email: client.email, ...(senha_hash ? { senha_hash } : {}) });
        return client;
      });
    },
    async createInvoice(body) {
      const value = required(body, { cliente_id: value => v.id(value, 'Cliente'), competencia: v.month, valor: v.money, data_vencimento: value => v.date(value, 'Vencimento') });
      value.data_emissao = today(); value.status = 'PENDENTE';
      if (value.data_vencimento < value.data_emissao) v.fail('O vencimento não pode ser anterior à emissão.');
      return repo.transaction(async tx => { const client = await found(tx, 'clientes', value.cliente_id); if (client.status !== 'ATIVO') throw new v.AppError(409, 'CLIENTE_INATIVO', 'Ative o cliente antes de emitir a fatura.'); return moneyOutput(await tx.create('faturas', value)); });
    },
    async updateInvoice(id, body) {
      const value = v.patch(body, { valor: v.money, data_vencimento: value => v.date(value, 'Vencimento'), status: value => v.choice(value, v.statuses.fatura, 'Status') });
      return repo.transaction(async tx => {
        const invoice = await found(tx, 'faturas', id);
        if (value.data_vencimento && value.data_vencimento < invoice.data_emissao) v.fail('O vencimento não pode ser anterior à emissão.');
        return moneyOutput(await tx.update('faturas', id, value));
      });
    },
    async generateInvoices(body) {
      bodyObject(body);
      const competencia = v.month(body.competencia); const data_vencimento = v.date(body.data_vencimento, 'Vencimento');
      if (data_vencimento < today() || data_vencimento.slice(0, 7) !== competencia) v.fail('O vencimento deve estar na competência e ser igual ou posterior à emissão.');
      return repo.transaction(async tx => {
        const clients = (await tx.list('clientes')).filter(row => row.status === 'ATIVO');
        const plans = await tx.list('planos'); const invoices = await tx.list('faturas');
        let geradas = 0; let existentes = 0;
        for (const client of clients) {
          if (invoices.some(row => row.cliente_id === client.id && row.competencia === competencia)) { existentes++; continue; }
          const plan = plans.find(row => row.id === client.plano_id);
          if (!plan) throw new v.AppError(409, 'PLANO_AUSENTE', `Cliente ${client.id} sem plano válido.`);
          try {
            await tx.create('faturas', { cliente_id: client.id, competencia, valor: plan.preco, data_emissao: today(), data_vencimento, status: 'PENDENTE' }); geradas++;
          } catch (error) { if (error.code === 'ER_DUP_ENTRY' || error.code === 'FATURA_DUPLICADA') existentes++; else throw error; }
        }
        return { geradas, existentes, competencia };
      });
    },
    async createTicket(body, user) {
      bodyObject(body);
      const cliente_id = user.perfil === 'CLIENTE' ? user.cliente_id : v.id(body.cliente_id, 'Cliente');
      if (user.perfil === 'CLIENTE' && body.cliente_id !== undefined && v.id(body.cliente_id) !== cliente_id) throw new v.AppError(403, 'ACESSO_NEGADO', 'Abra chamados somente para o seu cadastro.');
      const value = { cliente_id, descricao: v.text(body.descricao, 'Descrição', 8, 2000), data_abertura: today(), status: 'ABERTO', prioridade: v.choice(body.prioridade || 'MEDIA', v.statuses.prioridade, 'Prioridade') };
      return repo.transaction(async tx => { const client = await found(tx, 'clientes', cliente_id); if (client.status !== 'ATIVO') throw new v.AppError(409, 'CLIENTE_INATIVO', 'O cliente está inativo.'); return tx.create('chamados', value); });
    },
    async updateTicket(id, body) {
      const value = v.patch(body, { descricao: value => v.text(value, 'Descrição', 8, 2000), status: value => v.choice(value, v.statuses.chamado, 'Status'), prioridade: value => v.choice(value, v.statuses.prioridade, 'Prioridade') });
      return repo.transaction(async tx => { await found(tx, 'chamados', id); return tx.update('chamados', id, value); });
    },
    async remove(name, id) {
      return repo.transaction(async tx => {
        await found(tx, name, id);
        if (name === 'planos' && (await tx.list('clientes')).some(row => row.plano_id === id)) throw new v.AppError(409, 'PLANO_EM_USO', 'O plano possui clientes vinculados. Altere os vínculos antes de excluí-lo.');
        if (name === 'clientes') {
          const invoices = await tx.list('faturas'); const tickets = await tx.list('chamados');
          if ([...invoices, ...tickets].some(row => row.cliente_id === id)) throw new v.AppError(409, 'CLIENTE_EM_USO', 'O cliente possui faturas ou chamados. Desative o cadastro para preservar o histórico.');
          for (const user of await tx.list('usuarios')) if (user.cliente_id === id) await tx.remove('usuarios', user.id);
        }
        await tx.remove(name, id);
      });
    },
    async dashboard(user) {
      const tickets = await decorated('chamados', user); const invoices = user.perfil === 'SUPORTE' ? [] : await decorated('faturas', user);
      const clients = user.perfil === 'ADMIN' ? await repo.list('clientes') : [];
      let meu_plano = null;
      if (user.perfil === 'CLIENTE') { const client = await repo.get('clientes', user.cliente_id); meu_plano = moneyOutput(await found(repo, 'planos', client.plano_id)); }
      const total = status => invoices.filter(row => row.status === status).reduce((sum, row) => sum + Math.round(Number(row.valor) * 100), 0) / 100;
      return {
        clientes_ativos: clients.filter(row => row.status === 'ATIVO').length, planos: user.perfil === 'ADMIN' ? (await repo.list('planos')).length : 0,
        faturas_pendentes: invoices.filter(row => row.status === 'PENDENTE').length, valor_pendente: total('PENDENTE'), valor_recebido: total('PAGA'),
        chamados_abertos: tickets.filter(row => row.status !== 'RESOLVIDO').length,
        chamados: tickets.slice(0, 5), faturas: invoices.slice(0, 5), meu_plano,
      };
    },
  };
}
module.exports = { createServices };
