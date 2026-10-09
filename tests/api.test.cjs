'use strict';
const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../backend/src/app');
const { createTestRepository } = require('./repository.cjs');
const { config } = require('../backend/src/config');
const { verifyPassword } = require('../backend/src/passwords');

const mode = process.env.CONNECTNET_TEST_MODE || 'demo';
describe(`ConnectNet API REST em modo ${mode}`, () => {
  let server, close, base, repo;
  beforeEach(async () => { repo = await createTestRepository(mode); const instance = createApp(repo, config({ mode })); close = instance.close; server = instance.app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}/api/v1`; });
  afterEach(async () => { close?.(); if (server) await new Promise(resolve => server.close(resolve)); if (repo) await repo.close(); server = repo = close = null; });
  async function request(path, options = {}, session = null) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(session ? { Cookie: session.cookie, ...(options.csrf === false ? {} : { 'X-CSRF-Token': session.csrf }) } : {}), ...options.headers };
    const response = await fetch(base + path, { method: options.method || 'GET', headers, body: options.body ? JSON.stringify(options.body) : undefined });
    return { status: response.status, headers: response.headers, body: response.status === 204 ? null : await response.json() };
  }
  async function login(email = 'admin@connectnet.local', senha = 'ConnectNet#2026') {
    const response = await request('/auth/login', { method: 'POST', body: { email, senha } }); assert.equal(response.status, 200);
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: response.body.dados.csrfToken, user: response.body.dados.usuario, headers: response.headers };
  }
  const newClient = (email = 'novo@example.test') => ({ nome: 'Novo Assinante', email, telefone: '89999995555', endereco: 'Rua Nova, 55', plano_id: 1, senha: 'SenhaNova#2026' });
  function nextMonth() { const now = new Date(); const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 7); return { competencia: value, data_vencimento: `${value}-20` }; }

  test('saúde e arquivos da UI respondem e recebem cabeçalhos de proteção', async () => {
    const result = await request('/saude'); assert.equal(result.status, 200); assert.equal(result.body.dados.modo, mode);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    const page = await fetch(base.replace('/api/v1', '/login.html')); assert.equal(page.status, 200); assert.match(await page.text(), /login-form/); assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  });
  test('rotas de dados exigem uma sessão válida', async () => { assert.equal((await request('/clientes')).status, 401); assert.equal((await request('/dashboard')).status, 401); });
  test('login devolve perfil e cookie HttpOnly sem expor o hash', async () => {
    const session = await login(); assert.equal(session.user.perfil, 'ADMIN'); assert.match(session.headers.get('set-cookie'), /HttpOnly/); assert.match(session.headers.get('set-cookie'), /SameSite=Strict/); assert.ok(!('senha_hash' in session.user));
    const stored = (await repo.list('usuarios')).find(user => user.email === 'admin@connectnet.local'); assert.ok(stored.senha_hash.startsWith('scrypt$')); assert.equal(await verifyPassword('ConnectNet#2026', stored.senha_hash), true);
  });
  test('credencial incorreta falha e tentativas repetidas são limitadas', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await request('/auth/login', { method: 'POST', body: { email: 'admin@connectnet.local', senha: 'incorreta' } })).status, 401);
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: 'admin@connectnet.local', senha: 'incorreta' } })).status, 429);
  });
  test('escritas rejeitam CSRF ausente ou malformado e origem externa', async () => {
    const session = await login(); const body = { nome: 'Fibra Teste', velocidade: '900 Mbps', preco: '179.90' };
    assert.equal((await request('/planos', { method: 'POST', body, csrf: false }, session)).status, 403);
    assert.equal((await request('/planos', { method: 'POST', body, headers: { 'X-CSRF-Token': 'é'.repeat(64) } }, session)).status, 403);
    assert.equal((await request('/planos', { method: 'POST', body, headers: { Origin: 'https://outro.example' } }, session)).status, 403);
  });
  test('CRUD de planos funciona e plano vinculado não pode ser excluído', async () => {
    const session = await login(); const created = await request('/planos', { method: 'POST', body: { nome: 'Fibra Teste', velocidade: '900 Mbps', preco: '179.90' } }, session); assert.equal(created.status, 201);
    const id = created.body.dados.id; assert.equal((await request(`/planos/${id}`, { method: 'PUT', body: { preco: '189.90' } }, session)).body.dados.preco, 189.9);
    assert.equal((await request(`/planos/${id}`, { method: 'DELETE' }, session)).status, 204); assert.equal((await request('/planos/1', { method: 'DELETE' }, session)).status, 409);
  });
  test('cadastro de cliente cria conta e atualização mantém o acesso sincronizado', async () => {
    const admin = await login(); const result = await request('/clientes', { method: 'POST', body: newClient() }, admin); assert.equal(result.status, 201); const id = result.body.dados.id;
    assert.ok(!('senha' in result.body.dados)); const user = await login('novo@example.test', 'SenhaNova#2026'); assert.equal(user.user.cliente_id, id);
    assert.equal((await request(`/clientes/${id}`, { method: 'PUT', body: { email: 'atualizado@example.test', nome: 'Nome Atualizado', senha: 'OutraSenha#2026' } }, admin)).status, 200);
    assert.equal((await login('atualizado@example.test', 'OutraSenha#2026')).user.nome, 'Nome Atualizado');
    assert.equal((await request(`/clientes/${id}`, { method: 'DELETE' }, admin)).status, 204);
    assert.equal((await request('/auth/me', {}, user)).status, 401);
  });
  test('alteração apenas da senha é aceita e preserva os demais dados', async () => {
    const admin = await login(); const before = (await request('/clientes/1', {}, admin)).body.dados;
    assert.equal((await request('/clientes/1', { method: 'PUT', body: { senha: 'SenhaAlterada#2026' } }, admin)).status, 200);
    const after = (await request('/clientes/1', {}, admin)).body.dados; assert.equal(after.email, before.email); await login(before.email, 'SenhaAlterada#2026');
  });
  test('duplicidade de conta desfaz o cadastro parcial do cliente', async () => {
    const session = await login(); const result = await request('/clientes', { method: 'POST', body: newClient('admin@connectnet.local') }, session); assert.equal(result.status, 409);
    assert.equal((await request('/clientes', {}, session)).body.dados.length, 3); assert.equal((await repo.list('usuarios')).length, 5);
  });
  test('desativar cliente invalida o acesso e exclusão preserva registros vinculados', async () => {
    const admin = await login(); const client = await login('cliente@connectnet.local');
    assert.equal((await request('/clientes/1', { method: 'DELETE' }, admin)).status, 409);
    assert.equal((await request('/clientes/1', { method: 'PUT', body: { status: 'INATIVO' } }, admin)).status, 200);
    assert.equal((await request('/auth/me', {}, client)).status, 401);
  });
  test('valida IDs, campos, valores e datas de calendário', async () => {
    const session = await login(); assert.equal((await request('/clientes/abc', {}, session)).status, 400);
    assert.equal((await request('/clientes', { method: 'POST', body: { ...newClient(), plano_id: 999 } }, session)).status, 404);
    assert.equal((await request('/planos', { method: 'POST', body: { nome: 'Plano', velocidade: '50 Mbps', preco: '0' } }, session)).status, 400);
    assert.equal((await request('/faturas', { method: 'POST', body: { cliente_id: 1, competencia: '2099-02', valor: '100.00', data_vencimento: '2099-02-31' } }, session)).status, 400);
  });
  test('fatura pode ser criada, quitada e excluída sem duplicar a competência', async () => {
    const admin = await login(); const period = nextMonth();
    const body = { cliente_id: 1, valor: '109.90', ...period }; const created = await request('/faturas', { method: 'POST', body }, admin); assert.equal(created.status, 201);
    assert.equal((await request('/faturas', { method: 'POST', body }, admin)).status, 409);
    const id = created.body.dados.id; assert.equal((await request(`/faturas/${id}`, { method: 'PUT', body: { status: 'PAGA' } }, admin)).status, 200);
    assert.equal((await request('/dashboard', {}, admin)).body.dados.valor_recebido, 199.8);
    assert.equal((await request(`/faturas/${id}`, { method: 'DELETE' }, admin)).status, 204);
  });
  test('geração mensal é idempotente e inclui apenas clientes ativos', async () => {
    const admin = await login(); const period = nextMonth(); const first = await request('/faturas/gerar', { method: 'POST', body: period }, admin); const second = await request('/faturas/gerar', { method: 'POST', body: period }, admin);
    assert.equal(first.status, 201); assert.equal(first.body.dados.geradas, 2); assert.equal(second.body.dados.geradas, 0); assert.equal(second.body.dados.existentes, 2);
    assert.equal((await request('/faturas', {}, admin)).body.dados.length, 4);
  });
  test('duas gerações concorrentes não criam cobranças duplicadas', async () => {
    const admin = await login(); const results = await Promise.all([request('/faturas/gerar', { method: 'POST', body: nextMonth() }, admin), request('/faturas/gerar', { method: 'POST', body: nextMonth() }, admin)]);
    assert.ok(results.every(result => result.status === 201)); assert.equal(results.reduce((sum, result) => sum + result.body.dados.geradas, 0), 2); assert.equal((await request('/faturas', {}, admin)).body.dados.length, 4);
  });
  test('cliente acessa somente seus dados e não administra o provedor', async () => {
    const client = await login('cliente@connectnet.local'); const invoices = await request('/faturas', {}, client); assert.equal(invoices.body.dados.length, 1); assert.equal(invoices.body.dados[0].cliente_id, 1);
    assert.equal((await request('/faturas/2', {}, client)).status, 403); assert.equal((await request('/chamados/2', {}, client)).status, 403); assert.equal((await request('/clientes/2', {}, client)).status, 403); assert.equal((await request('/clientes/1', {}, client)).status, 200);
    assert.equal((await request('/clientes', {}, client)).status, 403); assert.equal((await request('/planos', { method: 'POST', body: { nome: 'Abuso' } }, client)).status, 403);
  });
  test('suporte atualiza chamados e não acessa o financeiro nem exclui registros', async () => {
    const support = await login('suporte@connectnet.local'); assert.equal((await request('/chamados/1', { method: 'PUT', body: { status: 'RESOLVIDO', prioridade: 'BAIXA' } }, support)).status, 200);
    assert.equal((await request('/faturas', {}, support)).status, 403); assert.equal((await request('/clientes/1', { method: 'PUT', body: { nome: 'Teste' } }, support)).status, 403); assert.equal((await request('/chamados/1', { method: 'DELETE' }, support)).status, 403);
  });
  test('CRUD de chamados aceita prioridades válidas e filtra os resultados', async () => {
    const admin = await login(); const created = await request('/chamados', { method: 'POST', body: { cliente_id: 2, descricao: 'Queda de conexão ao anoitecer', prioridade: 'ALTA' } }, admin); assert.equal(created.status, 201); const id = created.body.dados.id;
    assert.equal((await request(`/chamados/${id}`, { method: 'PUT', body: { status: 'RESOLVIDO' } }, admin)).status, 200);
    const filtered = await request('/chamados?status=RESOLVIDO&q=anoitecer', {}, admin); assert.equal(filtered.body.dados.length, 1);
    assert.equal((await request(`/chamados/${id}`, { method: 'PUT', body: { prioridade: 'URGENTISSIMA' } }, admin)).status, 400);
    assert.equal((await request(`/chamados/${id}`, { method: 'DELETE' }, admin)).status, 204);
  });
  test('cliente abre chamado próprio e tentativa de usar outro ID é rejeitada', async () => {
    const client = await login('cliente@connectnet.local'); assert.equal((await request('/chamados', { method: 'POST', body: { cliente_id: 2, descricao: 'Solicitação indevida' } }, client)).status, 403);
    const created = await request('/chamados', { method: 'POST', body: { descricao: 'Solicito verificação do Wi-Fi.' } }, client); assert.equal(created.status, 201); assert.equal(created.body.dados.cliente_id, 1);
  });
  test('logout encerra a sessão no servidor', async () => { const admin = await login(); assert.equal((await request('/auth/logout', { method: 'POST' }, admin)).status, 200); assert.equal((await request('/auth/me', {}, admin)).status, 401); });
  test('erros de JSON e endpoint são explícitos e não expõem detalhes internos', async () => {
    const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' }); assert.equal(response.status, 400); assert.equal((await response.json()).erro.codigo, 'JSON_INVALIDO');
    const admin = await login(); assert.equal((await request('/ausente', {}, admin)).status, 404);
  });
  test('senha com espaços é armazenada e verificada sem alteração', async () => {
    const admin = await login(); const body = { ...newClient(), senha: ' SenhaComEspacos#2026 ' }; assert.equal((await request('/clientes', { method: 'POST', body }, admin)).status, 201); await login(body.email, body.senha);
  });
});
