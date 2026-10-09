# Validação do ConnectNet Entrega 3

Validada em 09/10/2026 com dados fictícios, tanto em modo demo quanto com MySQL 8.0.46 real, em ambiente isolado. A API, as regras do banco, a interface e a persistência após reinícios foram aprovadas. Detalhes em [VALIDACAO_MYSQL.md](VALIDACAO_MYSQL.md).

| Execução | Aprovados | Falhas |
| --- | ---: | ---: |
| API em modo demo | 21 | 0 |
| API com MySQL | 21 | 0 |
| Integridade e reconexão MySQL | 9 | 0 |
| UI em modo demo | 15 | 0 |
| UI com MySQL | 15 | 0 |

O teste adicional de reinício confirmou a permanência de plano, cliente, fatura, chamado e login, primeiro após reiniciar Node e depois após reiniciar mysqld e Node.

## API

- Comando: `npm test`.
- Node.js: `v24.19.0`; Express: `5.2.1`; mysql2 instalado: `3.24.5`.
- 21 testes aprovados; 0 falhas, 0 cancelados e 0 ignorados.

- saúde e arquivos da UI respondem e recebem cabeçalhos de proteção.
- rotas de dados exigem uma sessão válida.
- login devolve perfil e cookie HttpOnly sem expor o hash.
- credencial incorreta falha e tentativas repetidas são limitadas.
- escritas rejeitam CSRF ausente ou malformado e origem externa.
- CRUD de planos funciona e plano vinculado não pode ser excluído.
- cadastro de cliente cria conta e atualização mantém o acesso sincronizado.
- alteração apenas da senha é aceita e preserva os demais dados.
- duplicidade de conta desfaz o cadastro parcial do cliente.
- desativar cliente invalida o acesso e exclusão preserva registros vinculados.
- valida IDs, campos, valores e datas de calendário.
- fatura pode ser criada, quitada e excluída sem duplicar a competência.
- geração mensal é idempotente e inclui apenas clientes ativos.
- duas gerações concorrentes não criam cobranças duplicadas.
- cliente acessa somente seus dados e não administra o provedor.
- suporte atualiza chamados e não acessa o financeiro nem exclui registros.
- CRUD de chamados aceita prioridades válidas e filtra os resultados.
- cliente abre chamado próprio e tentativa de usar outro ID é rejeitada.
- logout encerra a sessão no servidor.
- erros de JSON e endpoint são explícitos e não expõem detalhes internos.
- senha com espaços é armazenada e verificada sem alteração.

## Interface

- Navegador: `153.0.8010.0`.
- 15 verificações aprovadas; nenhum erro JavaScript durante os fluxos.
- O teste reproduzível está em `tests/ui.test.cjs`.

- Painel sem sessão redireciona para o login.
- Erro de login aparece no formulário.
- Login de administrador abre o painel com métricas.
- Plano cadastrado pela interface e confirmado na lista.
- Cliente cadastrado e editado com vínculo ao plano.
- Busca de clientes filtra a lista.
- Fatura criada e pagamento registrado pela interface.
- Geração mensal atende os clientes ativos.
- Chamado criado com prioridade alta e atualizado para resolvido.
- Exclusão solicita confirmação e remove o chamado.
- Texto HTML recebido da API é exibido sem executar código.
- Cliente possui menu limitado e consulta apenas as suas faturas.
- Painel móvel cabe em 390 pixels sem rolagem horizontal da página.
- Suporte pode editar chamados e não recebe ações financeiras ou de exclusão.
- Nenhum erro de JavaScript durante os fluxos verificados.

## Capturas reais

As quatro capturas abaixo também possuem versões com sufixo `-mysql.png`, registradas durante a validação conectada ao banco. O resultado detalhado está em `validacao-ui-mysql.json`.

- `evidencias/01-login-demo.png`
- `evidencias/02-painel-admin-demo.png`
- `evidencias/03-chamados-admin-demo.png`
- `evidencias/04-painel-cliente-mobile-demo.png`

## Conferências para o grupo

- Configurar as credenciais MySQL do ambiente do grupo e reproduzir os comandos de VALIDACAO_MYSQL.md, se necessário.
- Publicar a branch ou o commit efetivo no GitHub e conferir os arquivos enviados.
- Cadastrar os 16 cartões no Trello, distribuir responsáveis, anexar as evidências e concluir os aceites.

Os registros em JSON documentam a execução local com MySQL e em modo demo. A publicação no GitHub e a criação e revisão dos cartões no Trello continuam pendentes.
