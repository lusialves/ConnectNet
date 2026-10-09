# Validação MySQL do ConnectNet Entrega 3

Em 09/10/2026, o ConnectNet foi executado com MySQL real **8.0.46-0ubuntu0.24.04.3**, Node.js v24.19.0 e mysql2 3.24.5. Foram aprovados **30 testes da API e do banco**, **15 verificações da interface** e a comparação dos registros após reiniciar a aplicação e o próprio MySQL. A validação ocorreu em ambiente isolado com dados fictícios.

## Resultados

| Verificação | Resultado |
| --- | --- |
| API HTTP com MySQL | 21 testes aprovados e 0 falhas |
| Integridade, transações e reconexão | 9 testes aprovados e 0 falhas |
| Interface Chromium 153.0.8010.0 | 15 verificações aprovadas e 0 erros JavaScript |
| GET /api/v1/saude | HTTP 200 com status ok e modo mysql |
| Reinício do processo Node | Plano, cliente, fatura, chamado e acesso preservados |
| Reinício de mysqld e Node | Os mesmos registros e o login do cliente preservados |
| Limpeza dos testes | Nenhum banco temporário connectnet_test_... permaneceu |

## Tabelas conferidas no banco

Schema de validação: `connectnet_entrega3_validacao`. Contagens após cadastrar os registros do teste de persistência e concluir os reinícios:

| Tabela | Engine | Collation | Registros |
| --- | --- | --- | ---: |
| chamado | InnoDB | utf8mb4_0900_ai_ci | 3 |
| cliente | InnoDB | utf8mb4_0900_ai_ci | 4 |
| fatura | InnoDB | utf8mb4_0900_ai_ci | 3 |
| plano | InnoDB | utf8mb4_0900_ai_ci | 4 |
| usuario | InnoDB | utf8mb4_0900_ai_ci | 6 |

As restrições recuperadas de information_schema incluem quatro chaves estrangeiras, cinco chaves primárias, quatro restrições UNIQUE e três CHECK. A estrutura completa está em `validacao-mysql.json`.

## Testes específicos do MySQL

1. Cinco tabelas InnoDB e utf8mb4 em servidor MySQL real.
2. Chaves estrangeiras recusam referências inexistentes.
3. Exclusões preservam histórico e removem a conta do cliente sem vínculos.
4. Índices únicos impedem e-mails e competências duplicados.
5. CHECK protege valores e vínculo do perfil.
6. DECIMAL, DATE e consultas parametrizadas preservam os dados.
7. Rollback desfaz gravações quando a transação falha.
8. Segundo setup preserva registros e senhas existentes.
9. Dados permanecem após fechar e reabrir as conexões.

Os 21 testes HTTP incluem autenticação, autorização dos três perfis, CSRF, CRUD, desativação, duplicidade, rollback do cadastro de cliente e duas gerações mensais simultâneas sem faturas duplicadas. Os resultados individuais estão em `evidencias/mysql-api-integridade.tap`.

## Evidência dos reinícios

O teste cadastrou via API o plano 4, o cliente 4, a fatura 3 e o chamado 3. Encerrou e iniciou outro processo Node, fez novo login e comparou todos os campos com os dados anteriores. Depois encerrou a aplicação e o processo mysqld, iniciou ambos novamente e repetiu a comparação. O login do cliente criado continuou válido nos dois cenários. As três versões dos registros estão em `validacao-mysql.json`, nas propriedades before, afterAPI e afterMySQL.

As sessões em memória terminam no reinício; o teste abriu novas sessões para conferir o acesso. A senha do cliente não aparece nas evidências.

## Como reproduzir

Configure as credenciais do servidor MySQL no `.env` a partir de `.env.example`, mantendo um schema novo para esta entrega. Preserve as aspas em `SEED_PASSWORD="ConnectNet#2026"` e coloque também a senha do banco entre aspas, caso exista. Na pasta que contém package.json:

```bash
npm ci
npm run db:setup
npm run test:mysql
npx playwright install chromium
npm run test:ui:mysql
```

Os testes criam schemas exclusivos `connectnet_test_...` e removem apenas os schemas que eles mesmos criaram. O usuário de testes precisa de permissão para criar e remover esses bancos. O comando test:mysql cobre 21 testes HTTP e 9 testes SQL; test:ui:mysql cobre os 15 fluxos da interface e atualiza suas capturas. Nenhum desses comandos reinicia o serviço MySQL do computador.

Para repetir o teste de reinício, altere `DB_MODE=mysql`, execute `npm start`, cadastre os registros e encerre a aplicação. Inicie novamente e consulte os registros com um novo login. Depois encerre a aplicação, reinicie o serviço MySQL do seu ambiente, inicie a aplicação e confira novamente os mesmos registros.

## Evidências incluídas

- `validacao-mysql.json`: versão do banco, tabelas, restrições, contagens, saúde e registros antes e depois dos reinícios.
- `validacao-ui-mysql.json`: 15 verificações da interface e versão do navegador.
- `evidencias/mysql-api-integridade.tap`: resultado dos 30 testes com MySQL.
- `evidencias/01-login-mysql.png`: login sem atalhos de contas demo.
- `evidencias/02-painel-admin-mysql.png`: painel administrativo conectado ao MySQL.
- `evidencias/03-chamados-admin-mysql.png`: chamado criado e atualizado pela interface.
- `evidencias/04-painel-cliente-mobile-mysql.png`: painel do cliente em 390 pixels.

O requisito de validação local de API02 foi atendido. A publicação do código no GitHub e o cadastro e a revisão dos cartões no Trello ainda precisam ser realizados pelo grupo.

## Leitura da senha no arquivo de configuração

Em 09/10/2026, corrigimos .env.example para manter SEED_PASSWORD="ConnectNet#2026" entre aspas. O caractere # sem aspas é interpretado como comentário pelo Node.js. Em um banco novo, o setup executado por linha de comando leu a senha completa e o login MySQL respondeu HTTP 200; a versão truncada da senha foi recusada com HTTP 401. O registro está em validacao-env.json. A repetição do setup em um banco já populado continua preservando as senhas existentes.
