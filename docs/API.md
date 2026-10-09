# API ConnectNet

Base: `/api/v1`. O frontend é servido pelo mesmo Express, evitando configuração CORS desnecessária para a execução deste pacote. Requisições com origem externa são rejeitadas.

## Sessão

`POST /auth/login` recebe `{ "email": "admin@connectnet.local", "senha": "ConnectNet#2026" }`. A resposta inclui `dados.usuario`, `dados.csrfToken` e `dados.modo`; o servidor envia o cookie HttpOnly `connectnet_session`.

`GET /auth/me` retorna a sessão atual. Em POST, PUT e DELETE autenticados, envie o cookie e `X-CSRF-Token`. `POST /auth/logout` encerra a sessão no servidor. A sessão dura 8 horas por padrão e é invalidada se o cliente for desativado.

## Endpoints

| Método | Caminho | Perfis e finalidade |
| --- | --- | --- |
| GET | /saude | Público; disponibilidade e modo do banco |
| POST | /auth/login | Público; autenticação |
| GET | /auth/me | Todos autenticados; sessão |
| POST | /auth/logout | Todos autenticados; encerramento |
| GET | /dashboard | Todos; informações limitadas ao perfil |
| GET | /planos e /planos/{id} | Todos autenticados; consultar planos |
| POST | /planos | Admin; cadastrar |
| PUT | /planos/{id} | Admin; atualizar campos informados |
| DELETE | /planos/{id} | Admin; remover plano sem clientes |
| GET | /clientes | Admin e suporte; consultar cadastros |
| GET | /clientes/{id} | Admin, suporte e o próprio cliente |
| POST | /clientes | Admin; cadastrar cliente e conta |
| PUT | /clientes/{id} | Admin; atualizar cadastro e senha opcional |
| DELETE | /clientes/{id} | Admin; remover cliente sem faturas ou chamados |
| GET | /faturas e /faturas/{id} | Admin ou o próprio cliente |
| POST | /faturas | Admin; emitir uma cobrança |
| POST | /faturas/gerar | Admin; gerar competência para os clientes ativos |
| PUT | /faturas/{id} | Admin; atualizar valor, vencimento ou status |
| DELETE | /faturas/{id} | Admin; remover |
| GET | /chamados e /chamados/{id} | Todos; cliente limitado aos próprios |
| POST | /chamados | Todos; cliente abre somente para si |
| PUT | /chamados/{id} | Admin e suporte; atualizar atendimento |
| DELETE | /chamados/{id} | Admin; remover |

Listagens aceitam `q` para busca e, quando o módulo possui situação, `status`. Busca não altera permissões. Os retornos usam `{ "dados": ... }`. Exclusão concluída retorna 204 sem corpo.

## Corpos de criação

- Plano: `nome`, `velocidade`, `preco` e `descricao` opcional.
- Cliente: `nome`, `email`, `telefone`, `endereco`, `plano_id`, `senha` e `status` opcional.
- Fatura: `cliente_id`, `competencia` no formato AAAA-MM, `valor` e `data_vencimento` no formato AAAA-MM-DD. Emissão é a data corrente e status inicial é PENDENTE.
- Geração mensal: `competencia` e `data_vencimento`. O valor vem do plano de cada cliente ativo. Uma fatura por cliente e competência; cobrança existente, inclusive paga ou cancelada, não é recriada automaticamente.
- Chamado: `descricao`, `prioridade` opcional e `cliente_id` para administrador/suporte. O ID do cliente autenticado é definido pelo servidor.

## Regras

Senha: 8 a 128 caracteres para cadastro e alteração. E-mail normalizado para minúsculas. Valores positivos com até duas casas decimais. Plano e cliente precisam existir. Vencimento não pode ser anterior à emissão. Prioridades: BAIXA, MEDIA e ALTA. Chamados: ABERTO, EM_ATENDIMENTO e RESOLVIDO. Faturas: PENDENTE, PAGA e CANCELADA.

## Erros

Formato: `{ "erro": { "codigo": "DADOS_INVALIDOS", "mensagem": "..." } }`.

| Código HTTP | Situação |
| --- | --- |
| 400 | Dados ou JSON inválidos |
| 401 | Credenciais, sessão ou conta inválida |
| 403 | Permissão, origem ou token CSRF inválido |
| 404 | Registro, endpoint ou página não encontrado |
| 409 | Duplicidade ou vínculo que impede a operação |
| 413 | Corpo maior que 32 KB |
| 429 | Cinco falhas de login no intervalo de 15 minutos |
| 500 | Erro interno sem exposição de detalhes sensíveis |

O contrato legível por ferramentas está em `openapi.json`. A implantação demonstrada é acadêmica; sessões são locais ao processo e este pacote não integra cobrança bancária, pagamento automático ou equipamentos de rede.
