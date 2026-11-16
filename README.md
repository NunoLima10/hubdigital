# Hub Digital Cabo Verde

Plataforma colaborativa para descobrir, divulgar e apoiar projetos tecnológicos
criados em Cabo Verde. Criadores podem publicar o seu trabalho, receber feedback
e encontrar colaboradores; a comunidade pode descobrir projetos e acompanhar
os seus lançamentos.

O projeto está em desenvolvimento e aceita contribuições. Começa pelo
[guia de contribuição](CONTRIBUTING.md) e pela [arquitetura](docs/architecture.md).

## Funcionalidades implementadas

- Catálogo de projetos com pesquisa, filtros e mapa.
- Autenticação, perfis de criadores e onboarding.
- Submissão e edição de projetos, votos, favoritos e comentários.
- Pedidos de colaboração, convites, rankings e badges.
- Back-office para revisão, moderação e administração.
- API documentada com OpenAPI, migrações e testes automatizados.

Consulta o [backlog](PROJECT_BACKLOG.md) para o trabalho planeado. Os documentos
em `specs/` incluem propostas; nem todas estão implementadas.

## Requisitos

- Node.js **24.x**, também indicado em `.nvmrc`.
- pnpm **10.8.0**, indicado em `package.json`.
- Docker com Compose v2 e suporte a `docker compose up --wait`, em execução.
- Git e portas locais livres: `5432`, `3001`, `5173` e `5174`.

Se ainda não tens pnpm: `npm install --global pnpm@10.8.0`.
No Windows, usa Docker Desktop com containers Linux.

## Arranque local

```sh
git clone https://github.com/NunoLima10/hubdigital.git
cd hubdigital
pnpm install --frozen-lockfile
```

Copia os exemplos **apenas se os ficheiros de destino ainda não existirem**:

```sh
cp .env.example .env
cp api/.env.example api/.env
cp web/.env.example web/.env
cp admin/.env.example admin/.env
```

No PowerShell, podes usar `Copy-Item` em vez de `cp`.

1. Define uma password única em `HUBDIGITAL_DB_PASSWORD` no `.env` da raiz.
2. Usa a mesma password em `DATABASE_URL` no `api/.env`; codifica caracteres
   especiais para URL. Se mudares `HUBDIGITAL_DB_PORT`, atualiza também esse URL.
3. Substitui `COOKIE_SECRET` e `BETTER_AUTH_SECRET` por valores locais aleatórios.
   Para gerar cada segredo: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Mantém as integrações opcionais vazias para começar. Email/password funciona
   com os valores de exemplo de Google; esses valores não permitem login Google.

```sh
pnpm dev
```

Este comando espera que PostgreSQL esteja pronto, compila `shared`, aplica as
migrações e inicia a API e o website.

- Website: <http://localhost:5173>
- API: <http://localhost:3001>
- Swagger UI: <http://localhost:3001/docs>
- OpenAPI JSON: <http://localhost:3001/docs/json>

### Dados de demonstração e administração

Num segundo terminal, com `NODE_ENV=development` e `DB_SEEDING=true` em `api/.env`:

```sh
pnpm api:db:seed
pnpm admin:dev
```

O back-office fica em <http://localhost:5174>. O seed cria categorias, badges,
projetos de exemplo e o administrador local `demo.admin@hubdigital.cv`, com
password `demo1234`. Estas credenciais destinam-se apenas ao desenvolvimento;
nunca publiques uma base de dados de demonstração em produção.

`pnpm api:setup` prepara a base de dados e executa o seed sem iniciar as apps.
Preserva o volume existente; não é um comando de reset. O seed pode inserir ou
atualizar dados de referência. Consulta os [detalhes dos fixtures](api/src/db/seeds/data/README.md).

### Seed de produção

Produção precisa apenas dos dados estáticos: categorias, badges e, se as
variáveis `ADMIN_SEED_*` estiverem definidas, o primeiro administrador. Depois
de `pnpm api:build` e das migrações, corre:

```sh
pnpm api:db:seed:prod
```

Usa o build compilado e as variáveis do ambiente (não lê `api/.env` nem precisa
de `DB_SEEDING`). Nunca cria contas de demonstração nem projetos de exemplo,
seja qual for o `NODE_ENV`, e pode correr em cada deploy: atualiza nomes de
categorias e badges sem duplicar linhas. Termina com erro se algo falhar.

### Integrações opcionais

- **Uploads:** requerem R2 e as variáveis `CLOUDFLARE_*` da API. Sem configuração,
  os endpoints de upload devolvem `503`. Consulta [SECURITY.md](SECURITY.md).
- **Google:** requer credenciais OAuth reais para login Google.
- **Analytics:** chaves vazias mantêm PostHog e Umami desativados.
- **Mapas:** configuração e atribuição em [web/README.md](web/README.md).

Nunca coloques segredos em variáveis `VITE_APP_*`: são públicas no frontend.

## Comandos de desenvolvimento

| Comando | Utilização |
| --- | --- |
| `pnpm dev` | PostgreSQL, migrações, API e website |
| `pnpm dev:apps` | API e website, com a base de dados já preparada |
| `pnpm admin:dev` | Back-office, num terminal separado |
| `pnpm docker:down` | Parar PostgreSQL, preservando os dados |
| `pnpm api:db:gen` | Gerar migração após alterar schemas |
| `pnpm api:db:migrate` | Aplicar migrações existentes |
| `pnpm api:db:seed` | Inserir dados de referência e fixtures de desenvolvimento |
| `pnpm api:db:seed:prod` | Inserir só os dados de referência de produção (categorias, badges, admin) |
| `pnpm api:db:studio` | Inspecionar a base de dados local |
| `pnpm test:unit` | Testes unitários da API e testes web, sem Docker |
| `pnpm test` | Todos os testes API e web; requer Docker |
| `pnpm lint` | ESLint do website e back-office |
| `pnpm build` | Compilar e verificar tipos das três apps |
| `pnpm check` | Lint, testes e builds; também executado no CI |

Os testes de integração criam containers PostgreSQL descartáveis via
Testcontainers. Não precisam da tua base de dados local nem de credenciais de
produção. Os testes de browser opcionais estão descritos em [web/README.md](web/README.md).

## Estrutura e stack

| Pasta | Responsabilidade |
| --- | --- |
| `web/` | Site público: React, TanStack Start, Tailwind CSS e Base UI |
| `admin/` | Back-office: React, TanStack Router e Mantine |
| `api/` | Fastify, Better Auth, Drizzle e PostgreSQL |
| `packages/shared/` | Schemas Zod, tipos e regras partilhadas |
| `packages/theme/` | Tema reutilizável |
| `docs/` | Guias para desenvolvimento |
| `specs/` | Especificações e decisões de produto |

## Resolução de problemas

- **Docker indisponível:** inicia o Docker e confirma `docker info`. O comando
  `pnpm docker:up` espera até 120 segundos pela base de dados.
- **Password da base de dados inválida:** alterar `.env` não altera a password
  guardada num volume existente. Atualiza-a no PostgreSQL e nos dois ficheiros
  de ambiente; não apagues o volume para resolver este problema.
- **Porta ocupada:** liberta a porta ou ajusta a configuração e os URLs.
  Se o Vite escolher outra porta, atualiza também `ALLOWED_ORIGINS` na API.
- **Erro de configuração:** compara o teu `.env` com o exemplo correspondente.
  Variáveis opcionais podem ficar vazias; valores preenchidos têm de ser válidos.
- **Login admin/CORS:** confirma API em `3001`, admin em `5174` e ambos os
  origins `http://localhost:5173,http://localhost:5174` em `ALLOWED_ORIGINS`.
- **Alterações em `packages/shared` não aparecem:** executa `pnpm shared:build`
  e reinicia os processos de desenvolvimento.

## Contribuir

Lê [CONTRIBUTING.md](CONTRIBUTING.md). Correções de documentação, reprodução de
bugs e melhorias pequenas também são úteis. Abre uma issue para discutir
alterações maiores antes de investir na implementação.

## Licença

O código-fonte do Hub Digital é disponibilizado sob a GNU Affero General
Public License v3.0 only (`AGPL-3.0-only`). Quem disponibilizar publicamente
uma versão modificada através de uma rede deve também oferecer aos seus
utilizadores o código-fonte correspondente dessa versão, nos termos da AGPL.

A licença do código não concede direitos sobre o nome, os logótipos ou a
identidade visual do Hub Digital. Consulte [LICENSING.md](LICENSING.md),
[TRADEMARKS.md](TRADEMARKS.md) e [LICENSE.txt](LICENSE.txt). O conjunto de
dados de países mantém a sua licença ODbL separada.
