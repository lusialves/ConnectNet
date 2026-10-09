'use strict';
const express = require('express');
const path = require('node:path');
const { createAuth, allow } = require('./auth');
const { createServices } = require('./services');
const v = require('./validation');

function createApp(repo, config) {
  const app = express(); const auth = createAuth(repo, config); const service = createServices(repo);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" });
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    const origin = req.headers.origin;
    if (origin && origin !== `${req.protocol}://${req.get('host')}`) return next(new v.AppError(403, 'ORIGEM_NEGADA', 'A origem da requisição não é autorizada.'));
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  const router = express.Router();
  const ok = (res, dados, status = 200) => res.status(status).json({ dados });
  router.get('/saude', async (req, res) => { await repo.list('planos'); ok(res, { status: 'ok', sistema: 'ConnectNet', versao: '3.0.0', modo: repo.mode }); });
  router.post('/auth/login', async (req, res) => {
    const email = v.email(req.body?.email); const senha = req.body?.senha;
    if (typeof senha !== 'string' || senha.length < 1 || senha.length > 128) v.fail('Informe a senha.');
    ok(res, await auth.login(req, res, email, senha));
  });
  router.use(auth.middleware);
  router.get('/auth/me', (req, res) => ok(res, { usuario: req.user, csrfToken: req.session.csrf, modo: repo.mode }));
  router.post('/auth/logout', (req, res) => { auth.logout(req, res); ok(res, { mensagem: 'Sessão encerrada.' }); });
  router.get('/dashboard', async (req, res) => ok(res, await service.dashboard(req.user)));

  router.get('/planos', async (req, res) => ok(res, await service.list('planos', req.user, req.query)));
  router.get('/planos/:id', async (req, res) => ok(res, await service.get('planos', v.id(req.params.id), req.user)));
  router.post('/planos', allow('ADMIN'), async (req, res) => ok(res, await service.createPlan(req.body), 201));
  router.put('/planos/:id', allow('ADMIN'), async (req, res) => ok(res, await service.updatePlan(v.id(req.params.id), req.body)));
  router.delete('/planos/:id', allow('ADMIN'), async (req, res) => { await service.remove('planos', v.id(req.params.id)); res.status(204).end(); });

  router.get('/clientes', allow('ADMIN', 'SUPORTE'), async (req, res) => ok(res, await service.list('clientes', req.user, req.query)));
  router.get('/clientes/:id', async (req, res) => ok(res, await service.get('clientes', v.id(req.params.id), req.user)));
  router.post('/clientes', allow('ADMIN'), async (req, res) => ok(res, await service.createClient(req.body), 201));
  router.put('/clientes/:id', allow('ADMIN'), async (req, res) => ok(res, await service.updateClient(v.id(req.params.id), req.body)));
  router.delete('/clientes/:id', allow('ADMIN'), async (req, res) => { await service.remove('clientes', v.id(req.params.id)); res.status(204).end(); });

  router.get('/faturas', allow('ADMIN', 'CLIENTE'), async (req, res) => ok(res, await service.list('faturas', req.user, req.query)));
  router.get('/faturas/:id', allow('ADMIN', 'CLIENTE'), async (req, res) => ok(res, await service.get('faturas', v.id(req.params.id), req.user)));
  router.post('/faturas/gerar', allow('ADMIN'), async (req, res) => ok(res, await service.generateInvoices(req.body), 201));
  router.post('/faturas', allow('ADMIN'), async (req, res) => ok(res, await service.createInvoice(req.body), 201));
  router.put('/faturas/:id', allow('ADMIN'), async (req, res) => ok(res, await service.updateInvoice(v.id(req.params.id), req.body)));
  router.delete('/faturas/:id', allow('ADMIN'), async (req, res) => { await service.remove('faturas', v.id(req.params.id)); res.status(204).end(); });

  router.get('/chamados', async (req, res) => ok(res, await service.list('chamados', req.user, req.query)));
  router.get('/chamados/:id', async (req, res) => ok(res, await service.get('chamados', v.id(req.params.id), req.user)));
  router.post('/chamados', async (req, res) => ok(res, await service.createTicket(req.body, req.user), 201));
  router.put('/chamados/:id', allow('ADMIN', 'SUPORTE'), async (req, res) => ok(res, await service.updateTicket(v.id(req.params.id), req.body)));
  router.delete('/chamados/:id', allow('ADMIN'), async (req, res) => { await service.remove('chamados', v.id(req.params.id)); res.status(204).end(); });

  app.use('/api/v1', router);
  app.use('/api', (req, res, next) => next(new v.AppError(404, 'ROTA_AUSENTE', 'Endpoint não encontrado.')));
  app.get('/', (req, res) => res.redirect('/index.html'));
  app.use(express.static(path.join(config.root, 'frontend'), { dotfiles: 'deny', index: false }));
  app.use((req, res, next) => next(new v.AppError(404, 'ROTA_AUSENTE', 'Página não encontrada.')));
  app.use((error, req, res, next) => {
    let status = error.status || 500; let code = error.code || 'ERRO_INTERNO'; let message = error.message;
    if (error.type === 'entity.parse.failed') { status = 400; code = 'JSON_INVALIDO'; message = 'O corpo deve conter JSON válido.'; }
    if (error.type === 'entity.too.large') { status = 413; code = 'CORPO_EXCESSIVO'; message = 'A requisição excede 32 KB.'; }
    if (error.code === 'ER_DUP_ENTRY') { status = 409; code = 'REGISTRO_DUPLICADO'; message = 'O e-mail ou a fatura desta competência já está cadastrado.'; }
    if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code)) { status = 409; code = 'VINCULO_INVALIDO'; message = 'Verifique os vínculos com clientes, planos, faturas e chamados.'; }
    if (status === 500) { console.error('Erro interno:', error.code || error.name); message = 'Não foi possível concluir a operação. Tente novamente.'; }
    res.status(status).json({ erro: { codigo: code, mensagem: message } });
  });
  return { app, close: () => auth.close() };
}
module.exports = { createApp };
