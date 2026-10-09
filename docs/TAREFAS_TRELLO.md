# Cartões da Entrega 3 para o Trello

São 16 cartões separados: 8 da API e 8 da interface. O código foi preparado neste pacote. Os cartões ainda precisam ser cadastrados no quadro e revisados pelo grupo.

Quadro indicado na Entrega 2: https://trello.com/b/iS5eRal6

Listas sugeridas: A fazer, Em andamento, Em revisão e Concluído. Ao cadastrar estes cartões, use Em revisão; avance para Concluído depois de validar o critério, publicar o código e anexar a evidência. API02 já possui validação local com MySQL 8.0.46, documentada em VALIDACAO_MYSQL.md; falta a revisão do grupo e a evidência remota.

Use os títulos a seguir como cartões distintos, para tornar visível a quantidade mínima de tarefas. Os checklists dentro dos cartões complementam essa organização.

## API01 Configurar o projeto e o servidor

Definir Node.js, Express e variáveis de ambiente; organizar o servidor e expor a rota de saúde.

**Área:** API
**Dependências:** Nenhuma

**Critério de aceite**
Servidor inicia na porta configurada e GET /api/v1/saude retorna 200.

**Arquivos**
- `backend/server.js`
- `backend/src/config.js`
- `package.json`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Rota de saúde aprovada nos modos demo e mysql.

## API02 Preparar a persistência MySQL

Criar as cinco tabelas, os vínculos e o adaptador mysql2; fornecer setup sem apagar os dados existentes.

**Área:** API
**Dependências:** API01

**Critério de aceite**
Executar npm run db:setup em banco novo, iniciar DB_MODE=mysql e confirmar persistência após reinício.

**Arquivos**
- `database/schema.sql`
- `backend/src/mysql-repository.js`
- `backend/scripts/setup-db.js`
- `tests/mysql.test.cjs`
- `docs/VALIDACAO_MYSQL.md`
- `docs/validacao-mysql.json`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** MySQL 8.0.46: cinco tabelas criadas, nove testes SQL aprovados e registros preservados após reiniciar Node e mysqld em 09/10/2026.

## API03 Implementar autenticação e perfis

Armazenar hashes scrypt; manter sessões no servidor e separar administrador, suporte e cliente.

**Área:** API
**Dependências:** API02

**Critério de aceite**
Login válido cria cookie HttpOnly; credenciais incorretas e operações sem permissão são recusadas.

**Arquivos**
- `backend/src/auth.js`
- `backend/src/passwords.js`
- `backend/src/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Login, perfis, logout e hash verificados na API em demo e MySQL.

## API04 Implementar o cadastro de clientes

Cadastrar, consultar, editar e remover clientes; vincular plano e conta de acesso; permitir desativação.

**Área:** API
**Dependências:** API02, API03, API05

**Critério de aceite**
Cadastro cria cliente e usuário juntos; duplicidade desfaz a operação e desativação impede novo acesso.

**Arquivos**
- `backend/src/services.js`
- `backend/src/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** CRUD, sincronização da conta e rollback verificados em demo e MySQL.

## API05 Implementar a gestão de planos

Cadastrar, listar, editar e excluir planos; validar velocidade e mensalidade.

**Área:** API
**Dependências:** API02, API03

**Critério de aceite**
Preço positivo é obrigatório; plano com clientes vinculados não pode ser excluído.

**Arquivos**
- `backend/src/services.js`
- `backend/src/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** CRUD e restrição de vínculo verificados em demo e MySQL.

## API06 Implementar o faturamento mensal

Emitir, consultar, atualizar e remover faturas; gerar mensalidades sem duplicar cliente e competência.

**Área:** API
**Dependências:** API04, API05

**Critério de aceite**
Geração considera apenas clientes ativos; repetição não duplica cobrança; pagamento altera os totais.

**Arquivos**
- `backend/src/services.js`
- `backend/src/app.js`
- `database/schema.sql`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** CRUD, valores e geração idempotente verificados em demo e MySQL.

## API07 Implementar os chamados de suporte

Abrir, listar, editar e remover chamados com prioridade e situação de atendimento.

**Área:** API
**Dependências:** API03, API04

**Critério de aceite**
Cliente acessa somente seus chamados; suporte atualiza situação e prioridade sem excluir registros.

**Arquivos**
- `backend/src/services.js`
- `backend/src/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** CRUD, prioridade, filtros e autorização verificados em demo e MySQL.

## API08 Validar dados e documentar a API

Padronizar erros, validar dados e incluir proteção de escritas, testes e contrato OpenAPI.

**Área:** API
**Dependências:** API03, API04, API05, API06, API07

**Critério de aceite**
npm test passa; dados inválidos retornam 400, falta de sessão 401, permissão 403, ausência 404 e conflito 409.

**Arquivos**
- `backend/src/validation.js`
- `backend/src/app.js`
- `tests/api.test.cjs`
- `docs/openapi.json`
- `tests/mysql.test.cjs`
- `tests/repository.cjs`
- `tests/run-mysql.cjs`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** 21 testes HTTP em demo e 30 testes de API/banco em MySQL aprovados.

## UI01 Construir a tela de login

Criar formulário de acesso e feedback de autenticação; disponibilizar contas apenas no modo demo.

**Área:** UI
**Dependências:** API03

**Critério de aceite**
Campos possuem rótulos; falha de login aparece na tela; acesso válido abre o painel.

**Arquivos**
- `frontend/login.html`
- `frontend/js/login.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Login, erro de credenciais e redirecionamento verificados no navegador Nos modos demo e MySQL.

## UI02 Construir o painel por perfil

Exibir métricas de clientes, recebimentos e chamados, com informações próprias para cada perfil.

**Área:** UI
**Dependências:** UI01, API06, API07

**Critério de aceite**
Administrador vê a gestão geral; cliente vê seu plano e registros; suporte vê a central de chamados.

**Arquivos**
- `frontend/index.html`
- `frontend/js/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Painel e menus por perfil verificados no navegador Nos modos demo e MySQL.

## UI03 Construir a gestão de clientes

Criar lista, busca e formulários de cadastro e edição, com seleção de plano e desativação.

**Área:** UI
**Dependências:** API04, UI02

**Critério de aceite**
Cadastro e edição aparecem na lista; busca filtra os registros; senha é opcional durante edição.

**Arquivos**
- `frontend/js/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Cadastro, edição e busca de cliente verificados no navegador Nos modos demo e MySQL.

## UI04 Construir a gestão de planos

Criar tabela e formulários para nome, velocidade, preço e descrição do plano.

**Área:** UI
**Dependências:** API05, UI02

**Critério de aceite**
Plano salvo aparece na lista; edição altera a mensalidade; exclusão apresenta a resposta da API.

**Arquivos**
- `frontend/js/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Cadastro e edição de plano verificados no navegador Nos modos demo e MySQL.

## UI05 Construir a gestão de faturas

Criar consultas e emissão individual ou mensal; formatar reais e registrar pagamentos.

**Área:** UI
**Dependências:** API06, UI02

**Critério de aceite**
Nova fatura aparece na lista; marcar paga atualiza situação; cliente recebe apenas suas cobranças.

**Arquivos**
- `frontend/js/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Emissão, pagamento, geração e consulta por cliente verificados no navegador Nos modos demo e MySQL.

## UI06 Construir a central de chamados

Criar formulário de abertura, listagem, filtros e atualização do atendimento.

**Área:** UI
**Dependências:** API07, UI02

**Critério de aceite**
Chamado aberto aparece na lista; suporte ou administrador altera status; cliente acompanha sua solicitação.

**Arquivos**
- `frontend/js/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Abertura, resolução e exclusão com confirmação verificadas no navegador Nos modos demo e MySQL.

## UI07 Integrar a interface à API e à sessão

Centralizar fetch, incluir token CSRF em escritas, conferir sessão e permitir logout.

**Área:** UI
**Dependências:** API03, API08, UI01

**Critério de aceite**
Painel sem sessão redireciona; logout encerra acesso; operações usam respostas reais da API.

**Arquivos**
- `frontend/js/api.js`
- `frontend/js/app.js`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Integração HTTP, sessão e logout verificados no navegador Nos modos demo e MySQL.

## UI08 Conferir responsividade e mensagens

Adaptar menus, formulários e tabelas; incluir rótulos, foco, mensagens de erro e confirmação.

**Área:** UI
**Dependências:** UI03, UI04, UI05, UI06, UI07

**Critério de aceite**
Tela de 390 px não causa rolagem horizontal da página; tabelas mantêm rolagem própria; HTML de usuários permanece texto.

**Arquivos**
- `frontend/css/styles.css`
- `frontend/js/app.js`
- `tests/ui.test.cjs`

**Checklist do cartão**
- [ ] Revisar o código indicado
- [ ] Executar o critério de aceite
- [ ] Conferir a alteração no GitHub
- [ ] Anexar o link do commit e uma captura de execução
- [ ] Definir a responsável e registrar a revisão do grupo

**Validação realizada no pacote:** Interface móvel, conteúdo HTML e ausência de erro JavaScript verificados Nos modos demo e MySQL.

