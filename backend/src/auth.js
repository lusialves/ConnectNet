'use strict';
const { randomBytes, timingSafeEqual } = require('node:crypto');
const { AppError } = require('./validation');
const { verifyPassword } = require('./passwords');
const COOKIE = 'connectnet_session';

function publicUser(user) { return { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, cliente_id: user.cliente_id }; }
function createAuth(repo, config) {
  const sessions = new Map();
  const attempts = new Map();
  const duration = config.sessionHours * 60 * 60 * 1000;
  function prune() {
    const now = Date.now();
    for (const [key, value] of sessions) if (value.expires <= now) sessions.delete(key);
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  }
  const timer = setInterval(prune, 60_000); timer.unref();
  function cookie(req) {
    const token = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    return token && /^[a-f0-9]{96}$/.test(token) ? token : null;
  }
  async function active(user) {
    if (user.perfil !== 'CLIENTE') return true;
    const client = await repo.get('clientes', user.cliente_id);
    return client?.status === 'ATIVO';
  }
  return {
    sessions,
    async login(req, res, email, password) {
      prune();
      const key = `${req.ip}:${email}`;
      const attempt = attempts.get(key);
      if (attempt?.count >= 5) throw new AppError(429, 'TENTATIVAS_EXCEDIDAS', 'Aguarde 15 minutos antes de tentar novamente.');
      const user = (await repo.list('usuarios')).find(row => row.email === email);
      const valid = user && await verifyPassword(password, user.senha_hash) && await active(user);
      if (!valid) { attempts.set(key, { count: (attempt?.count || 0) + 1, until: attempt?.until || Date.now() + 15 * 60_000 }); throw new AppError(401, 'LOGIN_INVALIDO', 'E-mail ou senha inválidos, ou cadastro inativo.'); }
      attempts.delete(key);
      const oldToken = cookie(req); if (oldToken) sessions.delete(oldToken);
      const token = randomBytes(48).toString('hex');
      const csrf = randomBytes(32).toString('hex');
      sessions.set(token, { userId: user.id, csrf, expires: Date.now() + duration });
      res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: config.secureCookie, maxAge: duration, path: '/' });
      return { usuario: publicUser(user), csrfToken: csrf, modo: repo.mode };
    },
    async middleware(req, res, next) {
      try {
        const token = cookie(req); const session = sessions.get(token);
        if (!session || session.expires <= Date.now()) { if (token) sessions.delete(token); throw new AppError(401, 'SESSAO_AUSENTE', 'Entre novamente para continuar.'); }
        const user = await repo.get('usuarios', session.userId);
        if (!user || !await active(user)) { sessions.delete(token); throw new AppError(401, 'SESSAO_INVALIDA', 'A conta não está ativa.'); }
        req.user = publicUser(user); req.session = session; req.sessionToken = token;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          const sent = String(req.headers['x-csrf-token'] || '');
          if (!/^[a-f0-9]{64}$/.test(sent) || !timingSafeEqual(Buffer.from(sent), Buffer.from(session.csrf))) throw new AppError(403, 'CSRF_INVALIDO', 'Atualize a página e tente novamente.');
        }
        next();
      } catch (error) { next(error); }
    },
    logout(req, res) { sessions.delete(req.sessionToken); res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict', secure: config.secureCookie, path: '/' }); },
    close() { clearInterval(timer); sessions.clear(); attempts.clear(); },
  };
}
function allow(...roles) { return (req, res, next) => roles.includes(req.user.perfil) ? next() : next(new AppError(403, 'ACESSO_NEGADO', 'Seu perfil não permite esta operação.')); }
function owner(req, row) { if (req.user.perfil === 'CLIENTE' && row.cliente_id !== req.user.cliente_id) throw new AppError(403, 'ACESSO_NEGADO', 'Você pode acessar somente os seus registros.'); }
module.exports = { createAuth, allow, owner };
