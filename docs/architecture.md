# Arquitetura

O repositório é um workspace pnpm com três aplicações e dois pacotes partilhados.
Segue o módulo mais próximo da funcionalidade que estás a alterar.

## Aplicações

- `web`: site público com rendering no servidor através de TanStack Start.
  `src/routes` define páginas e `src/modules` agrupa funcionalidades, hooks e UI.
- `admin`: back-office com rotas protegidas e módulos de gestão. A autorização
  é também verificada pela API; esconder uma página não é uma barreira de segurança.
- `api`: servidor Fastify. `src/main.ts` gere arranque e encerramento;
  `src/server.ts` monta plugins e rotas, permitindo testes sem iniciar o processo
  de produção.

## Percurso de uma funcionalidade

Uma página em `web/src/routes` compõe componentes de `web/src/modules`.
Os hooks usam os clientes HTTP e TanStack Query para carregar dados da API.
Na API, o módulo `categories` é um exemplo do padrão existente:

1. `categories-routes.ts`: URL, schema da rota e handler.
2. `categories-schemas.ts`: validação e contrato HTTP/OpenAPI.
3. `categories-controllers.ts`: traduz o pedido/resposta para a chamada de serviço.
4. `categories-services.ts`: operações sobre a base de dados Drizzle.
5. `api/src/db/schemas`: tabelas e relações; `migrations` guarda a evolução do schema.

Alguns módulos pequenos ligam rotas diretamente a serviços. Mantém o padrão
local; extrai responsabilidades quando isso simplificar regras e testes.
Autenticação e autorização ficam nos hooks e serviços relevantes da API.

## Código partilhado

`packages/shared/src` contém schemas Zod, constantes e utilitários de domínio.
Mantém este pacote independente de React, Fastify, credenciais e acesso à base
de dados. Exporta novos contratos em `src/index.ts`.
`packages/theme` contém o tema reutilizável usado pelo admin.

As apps consomem o output compilado de `shared`. Os comandos de arranque e build
compilam-no; após uma edição durante o desenvolvimento, executa
`pnpm shared:build` e reinicia as apps.

## Testes e configuração

- `api/tests/unit`: regras e utilitários sem containers.
- `api/tests/e2e`: servidor e PostgreSQL descartável via Testcontainers.
- `web/tests`: componentes e utilitários com Vitest/jsdom.
- `web/tests/browser`: smoke tests opcionais; instruções em `web/README.md`.
- `.github/workflows/ci.yml`: executa os passos de `pnpm check` em jobs separados,
  com Node 24 e Docker no runner.

O `.env` da raiz configura Compose. Cada app tem o seu `.env.example`.
A API valida a configuração em `api/src/config/index.ts`; os frontends leem
variáveis públicas `VITE_APP_*`. Não coloques segredos no código partilhado ou
em variáveis públicas.

## Referências

- [Modelo de dados DBML](../api/src/db/schema.dbml)
- [Segurança e configuração de uploads](../SECURITY.md)
- [Guia de contribuição](../CONTRIBUTING.md)
- [Backlog](../PROJECT_BACKLOG.md)

Os documentos em `specs/` incluem propostas e contexto histórico. Confirma o
estado atual no código e nos testes antes de tratar uma proposta como contrato.
