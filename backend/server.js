'use strict';
const { config } = require('./src/config');
const { createApp } = require('./src/app');
const { createDemoRepository } = require('./src/demo-repository');
const { createMysqlRepository } = require('./src/mysql-repository');

async function start() {
  const settings = config();
  const repo = settings.mode === 'mysql' ? await createMysqlRepository(settings.db) : await createDemoRepository();
  const { app, close } = createApp(repo, settings);
  const server = app.listen(settings.port, settings.host, error => {
    if (error) { console.error(error.message); process.exitCode = 1; close(); repo.close(); return; }
    console.log(`ConnectNet: http://${settings.host}:${settings.port} | modo ${repo.mode}`);
    if (repo.mode === 'demo') console.log('Demonstração: dados em memória; reiniciar o servidor restaura os exemplos.');
  });
  async function shutdown() { server.close(); close(); await repo.close(); }
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
  return server;
}
if (require.main === module) start().catch(error => { console.error('Falha ao iniciar:', error.message); process.exitCode = 1; });
module.exports = { start };
