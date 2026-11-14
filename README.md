# Hub Digital cabo Verde

**Hub Digital** é uma plataforma colaborativa para descoberta, divulgação e apoio a produtos e projetos tecnológicos criados em Cabo Verde.

Esta plataforma cria um espaço onde os responsáveis por produtos e projetos tecnológicos cabo-verdianos podem publicar o seu próprio trabalho, receber feedback e ganhar visibilidade.

O projeto está em seu estágio inicial e procura seus primeiros contribuidores. O objetivo é construir um MVP simples e, posteriormente, migrar para tecnologias mais robustas

## 🌍 Visão

Promover e fortalecer a inovação digital "made in Cabo Verde", conectando criadores locais a oportunidades, visibilidade e comunidade.

## 🚀 Funcionalidades Previstas

- Lançamento de projetos e produtos
- Votação e comentários da comunidade
- Destaques diários/semanais
- Perfis dos responsáveis pelos projetos
- Integração com redes sociais e GitHub

## 🛠️ Stack Tecnológica

### Frontend

- [React](https://reactjs.org) - Biblioteca JavaScript para construção de interfaces
- [TanStack Start](https://tanstack.com/start) - routing, SSR e carregamento de dados
- [Tailwind CSS](https://tailwindcss.com/) e Base UI - estilos e componentes acessíveis

### Backend (API)

- [Fastify](https://fastify.dev/docs/latest/) - Framework web rápido e de baixa sobrecarga
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) - ORM TypeScript-first com foco em performance
- [PostgreSQL](https://www.postgresql.org) - Banco de dados relacional robusto

### Infraestrutura

- Deploy: Cloudflare /Netlify/ Render/ Railway
- CI/CD: GitHub Actions

## 🔧 Como rodar o projeto

### Projeto completo

1. Clone o repositório e instala as dependências:

   ```bash
   git clone https://github.com/NunoLima10/hubdigital.git
   cd hubdigital
   pnpm install
   ```

2. Cria a configuração local da API:

   ```bash
   cp api/.env.example api/.env
   cp .env.example .env
   ```

   Define uma password única em `HUBDIGITAL_DB_PASSWORD` no `.env` da raiz e
   usa a mesma password em `DATABASE_URL` no `api/.env`. Uma base de dados já
   existente mantém a password anterior: altera-a no PostgreSQL e atualiza
   ambos os ficheiros, sem apagar o volume.

3. Inicia PostgreSQL, aplica as migrações e executa a API e o website:

   ```bash
   pnpm dev
   ```

O website fica disponível em `http://localhost:5173` e a API em
`http://localhost:3001`.

Se a base de dados já estiver a correr, inicia apenas as aplicações:

```bash
pnpm dev:apps
```

### Executar separadamente

```bash
pnpm docker:up
pnpm api:db:migrate
pnpm api:dev
pnpm web:dev
```

Os comandos `api:dev` e `web:dev` devem ser executados em terminais separados.

## 📚 Documentação da API

A documentação da API está disponível em:

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`

## ✅ TODO

- [x] Set up `README.md` com visão geral do projeto
- [x] Criar guia de contribuição (`CONTRIBUTING.md`)
- [ ] Definir modelo de dados e criar diagrama em **DBML**
- [ ] Implementar autenticação na API
- [ ] Desenvolver endpoints principais
- [ ] Configurar pipeline CI/CD
