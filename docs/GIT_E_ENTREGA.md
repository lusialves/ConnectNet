# GitHub e conclusão da Entrega 3

## Estrutura atual do repositório

A árvore pública consultada em 08/10/2026 tem `backend/server.js`, manifests na raiz e no backend, `banco.sql`, `index.html` e `login.html` na raiz. A referência de revisão é `e69168feb142265512760b5f6bba7ffcfdee65ff`.

| Arquivo atual | Organização deste pacote |
| --- | --- |
| backend/server.js | Mantém o ponto de entrada e passa a usar backend/src |
| index.html e login.html na raiz | A interface ativa fica em frontend/index.html e frontend/login.html |
| banco.sql | O novo schema está em database/schema.sql, para connectnet_entrega3 |
| package.json e package-lock.json na raiz | Contêm os comandos npm start, npm test e npm run db:setup |
| backend/package.json e backend/package-lock.json | A instalação desta versão usa os manifests da raiz |

Teste o pacote em separado antes da integração. Ao levar a versão para a branch, compare também os arquivos HTML antigos e os manifests do backend. Use os comandos npm na raiz deste pacote; os HTML ativos são servidos pela nova configuração Express. Preserve as versões anteriores no histórico Git ou em uma pasta de arquivo do grupo, para evitar confundir a interface antiga com a atual.

A consulta confirmou a árvore e a revisão pública. A integração aos arquivos de trabalho do grupo continua sendo uma etapa de revisão; não houve escrita remota.

## Integrar ao repositório do grupo

Repositório indicado na Entrega 2: https://github.com/luis2alves/ConnectNet

1. Extraia e teste o pacote em uma pasta separada.
2. Abra uma cópia do repositório atual ou obtenha-a com:

```bash
git clone https://github.com/luis2alves/ConnectNet.git
cd ConnectNet
git switch -c entrega3
```

Se a branch `entrega3` já existir, use `git switch entrega3`. O nome da pasta baixada pelo Git pode ser ajustado pelo grupo.

3. Compare os arquivos atuais com este pacote no VS Code. Leve as alterações para a branch, preservando arquivos e dados de outras etapas que o grupo queira manter. Adapte qualquer trecho personalizado que esteja no repositório atual.
4. Instale as dependências e confira a aplicação nessa cópia:

```bash
npm ci
npm test
npm start
```

5. Depois da conferência, registre a versão:

```bash
git status
git add .
git commit -m "Entrega 3: API, interface, testes e documentação"
git push -u origin entrega3
```

Use a conta de uma integrante autorizada a enviar código ao repositório. A identidade de autoria do Git deve corresponder a quem executou o commit. `.env` e `node_modules` ficam fora do commit pelo `.gitignore`.

6. No GitHub, abra a branch e confirme que `backend`, `frontend`, `database`, `tests` e `docs` aparecem. Se o fluxo do grupo exigir integração à branch principal, abra a comparação e revise antes de mesclar.
7. Copie o link da branch ou do commit e acrescente-o ao relatório e aos cartões do Trello.

Se o endereço anterior tiver sido alterado ou não existir, crie o repositório na conta do grupo e use o endereço efetivo no relatório. Não apresente o link anterior como publicação desta versão até conferir os arquivos.

## Trello

Quadro indicado na Entrega 2: https://trello.com/b/iS5eRal6

Crie os 16 cartões de `TAREFAS_TRELLO.md`, identifique os de API e UI e defina a responsável em cada cartão. Cada cartão precisa de critério de aceite, checklist e referência ao código. Registre a evolução nas listas e marque Concluído após a conferência. API02 já foi validada localmente com MySQL 8.0.46; vincule o resultado de VALIDACAO_MYSQL.md ao cartão.

## Evidências a acrescentar ao relatório

- Repositório e branch da Entrega 3, com as pastas de API e UI.
- Histórico com o commit efetivo desta versão.
- Servidor iniciado com `DB_MODE=mysql` e resposta de `/api/v1/saude` com `modo: mysql`.
- Banco com as tabelas e registros; demonstração de que o cadastro permanece após reinício.
- Quadro do Trello mostrando 8 cartões da API e 8 da UI.
- Cartões com critérios, responsáveis e links do código.
- Telas principais funcionando no ambiente do grupo.

As capturas com sufixo `-mysql.png` documentam a interface conectada ao MySQL; as de sufixo `-demo.png` documentam o modo em memória. O registro `validacao-mysql.json` contém a versão real do banco, as tabelas, as restrições e a persistência após os reinícios. As evidências do GitHub e do Trello devem ser acrescentadas depois da publicação e da revisão dos cartões.

## Conferir o prazo

A imagem da atividade apresenta o período 14/09/2026 a 10/10/2026 no título e disponibilidade até 11/10/2026 às 23h59. Organize a entrega até 10/10 e confirme no ambiente virtual a data efetiva de encerramento.

## Apresentação oral

O ConnectNet gerencia clientes, planos, faturas e chamados de um provedor de internet. Nesta etapa, consolidamos uma API em Node.js e Express, com adaptador MySQL, e uma interface em HTML, CSS e JavaScript que usa fetch. Há três perfis: administrador, suporte e cliente. A API controla as permissões, e a interface acompanha esse controle. O faturamento mensal evita cobranças duplicadas por cliente e competência. Foram preparados 8 cartões da API e 8 da interface. A validação em MySQL 8.0.46 aprovou 30 testes de API/banco e 15 verificações da UI. Os registros e o login permaneceram após reiniciar a aplicação e o banco. Também passaram 21 testes da API e 15 da UI em modo demo. As evidências da publicação e do Trello devem ser acrescentadas pelo grupo.
