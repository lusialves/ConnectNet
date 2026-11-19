# Entrega 04 - ConnectNet: integração UI/API e execução das tarefas

**Período do enunciado:** 13/10/2026 a 30/11/2026 23h59.
**Elaboração deste pacote:** 18/11/2026.
**Equipe:** Adrielly Ferraz de Oliveira Brito; Caroline Borges Albuquerque; Lusia Alves da Silva Sousa Neta.
**Instituição:** Universidade Estadual do Piauí (UESPI) - EAD/UAPI, Polo Jerumenha.

## Escopo e origem

O ConnectNet é uma aplicação web para gerenciar clientes, planos, faturas e chamados de provedores de internet. Este pacote deriva do código e dos documentos das Entregas 01, 02 e 03 disponibilizados pela equipe. A Entrega 03 já registrava as 8 atividades API01–API08 e as 8 UI01–UI08. Nesta etapa, foi integrada ao projeto uma exportação segura de faturas em CSV e criados quatro novos testes HTTP.

**Atenção:** o enunciado pede incorporar "as ações recomendadas nesse encontro", mas não discrimina quais foram. As ações abaixo são pontos de revisão e melhorias propostos com base nos arquivos recebidos; não são transcrição de orientação do professor. Antes do envio final, completar a seção "Recomendações específicas do encontro" com o que foi efetivamente solicitado.

## Requisitos da atividade

| Exigência | Evidência no pacote |
| --- | --- |
| Implementar pelo menos 8 tarefas API | API01 a API08, com módulos e testes em backend/, database/ e tests/ |
| Implementar pelo menos 8 tarefas UI | UI01 a UI08, com HTML5/CSS3/JS em frontend/ |
| Organização das sprints no Trello | docs/trello-entrega04.csv com 16 cartões para conferência e atualização no quadro |
| Inclusão de recomendações do encontro | Pontos de revisão propostos; recomendações específicas ainda precisam ser fornecidas/confirmadas |
| Integração UI/API | fetch com sessão via cookie, formulários e endpoints /api/v1; nova exportação CSV |
| Evidência de testes | docs/entrega04-testes-api.tap e docs/entrega04-validacao.json (25/25 API modo demo) |

## Matriz das 8 tarefas da API

| ID | Tarefa | Critério de aceite | Ponto de revisão da Entrega 04 |
| --- | --- | --- | --- |
| API01 | Configurar o projeto e o servidor | Servidor inicia na porta configurada e GET /api/v1/saude retorna 200. | Conferir inicialização, configurações seguras e rota de diagnóstico. |
| API02 | Preparar a persistência MySQL | Executar npm run db:setup em banco novo, iniciar DB_MODE=mysql e confirmar persistência após reinício. | Repetir teste de integridade e persistência em MariaDB/MySQL no laboratório. |
| API03 | Implementar autenticação e perfis | Login válido cria cookie HttpOnly; credenciais incorretas e operações sem permissão são recusadas. | Verificar sessão HttpOnly, proteção CSRF e acessos por papel. |
| API04 | Implementar o cadastro de clientes | Cadastro cria cliente e usuário juntos; duplicidade desfaz a operação e desativação impede novo acesso. | Exercitar cadastro, duplicidade, atualização e desativação. |
| API05 | Implementar a gestão de planos | Preço positivo é obrigatório; plano com clientes vinculados não pode ser excluído. | Verificar validações de preço e impedimento de exclusões vinculadas. |
| API06 | Implementar o faturamento mensal | Geração considera apenas clientes ativos; repetição não duplica cobrança; pagamento altera os totais. | Conferir geração mensal, pagamento, exportação filtrada e isolamento de dados. |
| API07 | Implementar os chamados de suporte | Cliente acessa somente seus chamados; suporte atualiza situação e prioridade sem excluir registros. | Revisar autorização dos chamados e acesso apenas aos registros do cliente. |
| API08 | Validar dados e documentar a API | npm test passa; dados inválidos retornam 400, falta de sessão 401, permissão 403, ausência 404 e conflito 409. | Executar regressão, documentar respostas de erro e API OpenAPI. |

## Matriz das 8 tarefas da interface

| ID | Tarefa | Critério de aceite | Ponto de revisão da Entrega 04 |
| --- | --- | --- | --- |
| UI01 | Construir a tela de login | Campos possuem rótulos; falha de login aparece na tela; acesso válido abre o painel. | Validar mensagens de login e usabilidade dos campos. |
| UI02 | Construir o painel por perfil | Administrador vê a gestão geral; cliente vê seu plano e registros; suporte vê a central de chamados. | Revisar dados e menus exclusivos de cada perfil. |
| UI03 | Construir a gestão de clientes | Cadastro e edição aparecem na lista; busca filtra os registros; senha é opcional durante edição. | Revisar formulário e mensagens de validação de clientes. |
| UI04 | Construir a gestão de planos | Plano salvo aparece na lista; edição altera a mensalidade; exclusão apresenta a resposta da API. | Validar atualização de mensalidades e retornos de erro. |
| UI05 | Construir a gestão de faturas | Nova fatura aparece na lista; marcar paga atualiza situação; cliente recebe apenas suas cobranças. | Conferir filtros, marcação de pagamento e download da listagem. |
| UI06 | Construir a central de chamados | Chamado aberto aparece na lista; suporte ou administrador altera status; cliente acompanha sua solicitação. | Validar abertura e alteração de chamados por perfil. |
| UI07 | Integrar a interface à API e à sessão | Painel sem sessão redireciona; logout encerra acesso; operações usam respostas reais da API. | Conferir respostas reais, sessão, logout e exportação. |
| UI08 | Conferir responsividade e mensagens | Tela de 390 px não causa rolagem horizontal da página; tabelas mantêm rolagem própria; HTML de usuários permanece texto. | Verificar 390 px, foco por teclado, mensagens e segurança de conteúdo. |

## Melhorias efetivamente acrescentadas na versão 4.0.0

1. **API06:** `GET /api/v1/faturas/exportar` implementado antes da rota dinâmica `/faturas/:id`, com o mesmo controle de autorização das listas de faturas e filtros `q`/`status`.
2. **API08:** retorno CSV em UTF-8 com BOM, separador `;`, escape de aspas e neutralização de fórmulas em campos textuais. Quatro novos testes HTTP asseguram exportação, segregação de clientes, tratamento de dados e rejeição de filtros inválidos. OpenAPI atualizado.
3. **UI05:** botão **Exportar CSV** acrescentado à barra de filtros da aba Faturas, utilizando os filtros selecionados.
4. **UI07:** biblioteca de requisições da interface ampliada para tratar downloads via `fetch` autenticado e apresentar mensagens ao usuário.

## Resultado das verificações nesta preparação

- **API demo:** 25 testes automatizados, 25 aprovados, 0 falhas. Execução atual em 18/11/2026.
- **Navegador:** o ambiente atual bloqueou navegação do Chromium. Não é correto afirmar que a nova interface passou nos 15 testes da versão anterior nesta sessão. As capturas existentes são da Entrega 03, e podem ser usadas como referência histórica, não como evidência de novos testes.
- **MySQL/MariaDB:** não executados na sessão atual. A Entrega 03 registra 21 testes da API no XAMPP/MariaDB e testes em MySQL isolado. Repetir na máquina do grupo.
- **Trello/GitHub:** os arquivos demonstram organização e código local, mas não confirmam atualização do quadro ou publicação da versão 4 em repositório remoto.

## Como executar e conferir

```bash
npm ci
# Copiar .env.example para .env; configurar DB_MODE=demo
npm start
# Acesse http://127.0.0.1:3000/login.html
npm test
```

Para testar com banco persistente, iniciar MySQL/MariaDB, configurar DB_MODE=mysql e as credenciais no `.env`, executar `npm run db:setup`, `npm start`, os testes disponíveis e confirmar que um cadastro permanece após reinício. Para UI automatizada, com Playwright/Chromium instalado, executar `npm run test:ui`. Não publicar o arquivo `.env`, credenciais ou a pasta `node_modules`.

## Pendências obrigatórias de conferência

- Inserir as **recomendações específicas do encontro** e apontar em quais cartões foram tratadas.
- Conferir no **Trello** os 16 cartões, responsáveis, listas, checklists, datas e links de commits/PRs; anexar capturas atuais como evidência.
- Publicar o código atualizado no **GitHub** do grupo e registrar o commit/branch da Entrega 04.
- Rodar a interface no computador do grupo e conferir exportação CSV, responsividade e acessos por perfil.
- Conferir o banco MySQL/MariaDB com persistência ativa; anexar prints da inicialização, banco e testes.

**Quadro informado na Entrega 03:** https://trello.com/b/iS5eRal6
**Repositório informado na Entrega 03:** https://github.com/lusialves/ConnectNet

## Recomendações específicas do encontro (preencher com a equipe)

Não foram disponibilizadas no enunciado/imagem ou nos arquivos anexados. Campo reservado para registrar os apontamentos recebidos do professor e associá-los a API01–API08/UI01–UI08, sem inventar exigências.
