# ConnectNet - Sistema de Gerenciamento de Provedor de Internet | Entrega 04

O **ConnectNet** é uma plataforma web de gerenciamento desenvolvida para atender às demandas operacionais de Provedores de Serviços de Internet (ISPs) de pequeno e médio porte. O projeto visa substituir processos manuais e planilhas descentralizadas por um sistema integrado para administrar clientes, planos, faturas e chamados de suporte.
---

## Funcionalidades (MVP)

* **Painel Administrativo Dinâmico (SPA):** Interface de página única com navegação entre módulos, indicadores e menus conforme o perfil autenticado. A sessão é controlada pelo servidor e identificada por um cookie `HttpOnly`.
* **Gestão de Clientes:** Cadastro, edição, listagem, busca e exclusão de assinantes, com vínculo a um plano e criação da conta de acesso do cliente. A exclusão respeita os vínculos com faturas e chamados para preservar o histórico.
* **Gestão de Planos:** Cadastro e administração dos pacotes de internet, incluindo nome, velocidade e valor mensal.
* **Gestão de Faturas:** Emissão individual e geração mensal por competência, acompanhamento de vencimento e situação do pagamento, valores em Reais (R$), controle de duplicidade e **exportação CSV com filtros e permissões por perfil**.
* **Central de Chamados:** Abertura e acompanhamento de tickets com prioridades Baixa, Média e Alta e status Aberto, Em atendimento e Resolvido.
* **Segurança e Autenticação:** Validação de credenciais no servidor, senhas armazenadas com hash `scrypt`, sessão por cookie `HttpOnly` e `SameSite=Strict`, proteção CSRF e permissões por perfil. Clientes acessam somente os seus dados.

---

## Arquitetura e Tecnologias

O sistema utiliza uma arquitetura Cliente-Servidor, com frontend e backend organizados em pastas separadas. Na execução local, o Express serve a interface e a API no mesmo endereço.

* **Frontend:** HTML5, CSS3 e JavaScript nativo (Vanilla JS), com navegação SPA e consumo assíncrono da API REST por meio de `fetch`.
* **Backend:** Node.js 22 ou superior e Express. A porta padrão é `3000`, e os endpoints utilizam o prefixo `/api/v1`.
* **Banco de Dados:** Schema `connectnet_entrega3`, com cinco tabelas relacionais, InnoDB, `utf8mb4` e acesso pelo driver `mysql2`. A validação completa foi realizada com MySQL 8.0.46. Também foram verificados a API e o cadastro persistente de cliente no XAMPP com MariaDB 10.4.32.

---

## Estrutura do Projeto

```text
ConnectNet/
├── backend/
│   ├── server.js              # Ponto de entrada da aplicação
│   ├── scripts/setup-db.js    # Criação do banco e dos dados de exemplo
│   └── src/                   # Autenticação, regras, validação e persistência
├── database/
│   └── schema.sql             # Estrutura das cinco tabelas relacionais
├── docs/                      # API, tarefas, relatório e evidências dos testes
├── frontend/
│   ├── index.html             # Painel principal do sistema
│   ├── login.html             # Tela de autenticação
│   ├── css/                   # Estilos da interface
│   └── js/                    # Navegação, formulários e consumo da API
├── tests/                     # Testes da API, banco e interface
├── .env.example               # Modelo das variáveis de ambiente
├── .gitignore                 # Regras para arquivos locais e dependências
├── package-lock.json          # Versões das dependências
├── package.json               # Dependências e comandos npm
└── README.md                  # Documentação do projeto
```

O arquivo `.env` é criado localmente a partir de `.env.example`. As dependências são instaladas em `node_modules/`. Esses arquivos locais devem permanecer fora do versionamento, conforme o `.gitignore`.

---

## Stakeholders e Permissões

* **Clientes:** Consulta do plano contratado e das próprias faturas, além de abertura e acompanhamento dos próprios chamados.
* **Administradores:** Gerenciamento de clientes, planos, faturas e chamados, geração de mensalidades e acesso aos indicadores administrativos.
* **Suporte Técnico:** Abertura e acompanhamento de chamados, atualização de status e definição de prioridades. Esse perfil não administra o financeiro nem exclui registros.

As permissões são verificadas pela API e refletidas nos menus e nas ações disponíveis na interface.

---

## Como Executar o Projeto

### Pré-requisitos

Antes de começar, tenha instalado:

* **Node.js 22 ou superior**, conforme o requisito de `package.json`.
* **Servidor de banco de dados:** MySQL Server (via MySQL Workbench, phpMyAdmin ou XAMPP).
* **Git**, para clonar e atualizar o repositório.
* **VS Code**, recomendado para editar os arquivos e utilizar o terminal.

O phpMyAdmin e o MySQL Workbench podem ser utilizados para consultar o banco. O servidor de banco de dados precisa estar em execução.

---

### 1. Obter o código da Entrega 04

Use o arquivo `ConnectNet_Entrega04_Codigo.zip` deste material, extraindo a pasta `ConnectNet/`. O repositório histórico informado na Entrega 03 é `https://github.com/lusialves/ConnectNet`, mas esta atualização da Entrega 04 não foi publicada remotamente durante a preparação do pacote.

Acesse a pasta extraída no terminal antes de executar os comandos seguintes.


### 2. Configurar o Banco de Dados (MySQL)

Execute os comandos na **raiz do projeto**, onde estão `package.json` e `.env.example`.

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Crie o arquivo `.env`, preservando uma configuração existente. No terminal PowerShell do VS Code, execute:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

3. Inicie o servidor de banco de dados. No XAMPP, clique em **Start** no módulo **MySQL** e aguarde a indicação de que está ativo. No ambiente XAMPP verificado nesta entrega, esse módulo executa **MariaDB 10.4.32**.

4. Confira os dados de conexão no `.env` e ajuste usuário, senha, host ou porta conforme a sua instalação:

   ```dotenv
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=connectnet_entrega3
   SEED_PASSWORD="ConnectNet#2026"
   ```

   Mantenha senhas entre aspas quando houver caracteres como `#`. Exemplo: `DB_PASSWORD="sua_senha"`.

5. Crie a estrutura do banco e os dados de exemplo:

   ```bash
   npm run db:setup
   ```

   O script utiliza `database/schema.sql` e cria as tabelas `plano`, `cliente`, `usuario`, `fatura` e `chamado`. Em um banco novo, insere os dados de exemplo. Se já existirem registros em `plano`, `cliente` ou `usuario`, preserva os dados e não repete a inserção dos exemplos.

6. Edite o `.env` e configure:

   ```dotenv
   DB_MODE=mysql
   ```

   O valor `mysql` seleciona o adaptador de persistência, inclusive no ambiente MariaDB do XAMPP verificado. Os registros ficam no banco e permanecem após reiniciar a aplicação.

O schema desta entrega é `connectnet_entrega3`. O setup não migra os dados do schema `connectnet` utilizado na versão anterior.

### 3. Configurar e Iniciar o Backend

As dependências foram instaladas na etapa anterior. Permaneça na **raiz do projeto** e inicie a aplicação:

```bash
npm start
```

O comando executa `backend/server.js`. Por padrão, a aplicação fica disponível em [http://127.0.0.1:3000](http://127.0.0.1:3000). Mantenha o terminal aberto enquanto utiliza o sistema.

Para acompanhar alterações durante o desenvolvimento, utilize `npm run dev`.

Para uma demonstração sem servidor de banco de dados, configure `DB_MODE=demo` e reinicie a aplicação. Nesse modo, os dados ficam na memória e os exemplos são restaurados quando o servidor reinicia.

### 4. Executar o Frontend

Com a aplicação iniciada, abra no navegador:

[http://127.0.0.1:3000/login.html](http://127.0.0.1:3000/login.html)

A interface é servida pelo Express. Utilize esse endereço para que as requisições à API e os cookies de sessão funcionem na mesma origem.

#### Contas de exemplo

| Perfil | E-mail | Senha padrão |
| --- | --- | --- |
| Administrador | admin@connectnet.local | ConnectNet#2026 |
| Suporte técnico | suporte@connectnet.local | ConnectNet#2026 |
| Cliente | cliente@connectnet.local | ConnectNet#2026 |

No modo com banco de dados, a senha das contas de exemplo é o valor de `SEED_PASSWORD` no primeiro setup. Alterar essa variável depois não redefine as senhas já cadastradas. As contas da tabela são para testes; antes de uma utilização real, defina credenciais próprias.

As sessões expiram após 8 horas por padrão ou quando o processo Node.js reinicia. Nesse caso, faça login novamente. No modo `mysql`, os dados cadastrados permanecem no banco.

#### Validação e testes

Para verificar o funcionamento da aplicação, consulte [http://127.0.0.1:3000/api/v1/saude](http://127.0.0.1:3000/api/v1/saude). Com `DB_MODE=mysql`, a resposta deve indicar `status: "ok"` e `modo: "mysql"`.

Para executar os **21 testes da API em modo demo**:

```bash
npm test
```

Para executar os **21 testes da API com o banco do XAMPP**, utilize o PowerShell, com o banco ativo e o `.env` configurado:

```powershell
$env:CONNECTNET_TEST_MODE = "mysql"
node --test tests/api.test.cjs
Remove-Item Env:CONNECTNET_TEST_MODE
```

Para executar os **30 testes da API e da integridade do banco com MySQL 8.0.46**:

```bash
npm run test:mysql
```

Essa suíte inclui uma verificação específica de servidor MySQL e rejeita MariaDB. No XAMPP com MariaDB, utilize o comando de testes da API apresentado acima.

Os testes com banco criam e removem schemas exclusivos com prefixo `connectnet_test_`. O usuário configurado precisa de permissão para criar e remover esses schemas; os testes não usam os registros do schema da aplicação.

Para executar as **15 verificações da interface em modo demo**:

```bash
npx playwright install chromium
npm run test:ui
```

Com o MySQL configurado, as mesmas verificações da interface podem ser executadas por `npm run test:ui:mysql`.

**Resultados verificados em 09/10/2026:**

* **MySQL 8.0.46, em ambiente isolado:** 21 testes da API, 9 do banco e 15 da interface aprovados. Planos, clientes, faturas, chamados e acesso do cliente foram preservados após reiniciar a aplicação e o MySQL.
* **XAMPP com MariaDB 10.4.32, no Windows:** 21 testes da API aprovados, e permanência de um cliente cadastrado confirmada após reiniciar a aplicação.

---

## Sobre o Projeto

O **ConnectNet** foi desenvolvido em 2026 para o curso de Tecnologia em Sistemas para Internet da **Universidade Estadual do Piauí – UESPI (EAD - UAPPI)**, Polo Jerumenha.

O objetivo central da aplicação é substituir processos manuais e planilhas descentralizadas por um sistema integrado, reduzir falhas de faturamento e melhorar o acompanhamento do suporte técnico em provedores de banda larga.

**Discentes / Desenvolvedoras:**

* Adrielly Ferraz de Oliveira Brito
* Caroline Borges Albuquerque
* Lusia Alves da Silva Sousa Neta

---

## Entrega 04 - Integração API/UI e evidências (13/10/2026 a 30/11/2026)

A Entrega 04 preserva as oito tarefas de API (API01 a API08) e oito de UI (UI01 a UI08) implementadas e documentadas anteriormente. Acrescenta melhoria funcional integrada ao módulo financeiro:

- `GET /api/v1/faturas/exportar`: retorna planilha CSV UTF-8 com cabeçalho, separador ponto e vírgula, filtro textual `q` e filtro `status`; valida sessão e perfil, restringe dados do cliente às próprias faturas e neutraliza possíveis fórmulas no CSV.
- Na aba **Faturas**, o botão **Exportar CSV** baixa os registros conforme os filtros selecionados.
- Foram acrescidos quatro testes HTTP à suíte da API: exportação e filtros, isolamento por perfil, sanitização de conteúdo e rejeição de filtro inválido.
- Atualizados versão, documentação OpenAPI, matriz de rastreabilidade e material para acompanhamento no Trello.

O arquivo `docs/ENTREGA04.md` detalha os requisitos, as tarefas e as evidências. O arquivo `docs/trello-entrega04.csv` serve para organizar/atualizar os cartões no Trello, mas **não constitui prova de sua publicação remota**. Registre no quadro as recomendações específicas discutidas com o professor, se houver, porque o enunciado disponibilizado não as discrimina.

**Para verificar:** execute `npm ci`, `npm test`, `npm run test:ui` (com Chromium Playwright instalado) e, opcionalmente, `npm run test:mysql` em um MySQL compatível. O banco MariaDB deve ser validado localmente com suas próprias credenciais. Não execute dados de exemplo em uma instalação de produção.