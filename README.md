# Hub Digital cabo Verde

**Hub Digital** é uma plataforma colaborativa para descoberta, divulgação e apoio a produtos e projetos tecnológicos criados em Cabo Verde.

Inspirada por iniciativas como Product Hunt, esta plataforma visa criar um ecossistema onde makers, devs, designers, estudantes e empreendedores locais possam lançar suas ideias, obter feedback e ganhar visibilidade.

O projeto está em seu estágio inicial e procura seus primeiros contribuidores. O objetivo é construir um MVP simples e, posteriormente, migrar para tecnologias mais robustas

## 🌍 Visão

Promover e fortalecer a inovação digital "made in Cabo Verde", conectando criadores locais a oportunidades, visibilidade e comunidade.

## 🚀 Funcionalidades Previstas

- Lançamento de projetos e produtos
- Votação e comentários da comunidade
- Destaques diários/semanais
- Perfis de makers
- Integração com redes sociais e GitHub

## 🛠️ Stack Tecnológica

### Frontend

- [React](https://reactjs.org) - Biblioteca JavaScript para construção de interfaces
- [Mantine UI](https://mantine.dev/getting-started/) - Framework de componentes React modernos

### Backend (API)

- [Fastify](https://fastify.dev/docs/latest/) - Framework web rápido e de baixa sobrecarga
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) - ORM TypeScript-first com foco em performance
- [PostgreSQL](https://www.postgresql.org) - Banco de dados relacional robusto

### Infraestrutura

- Deploy: Cloudflare /Netlify/ Render/ Railway
- CI/CD: GitHub Actions

## 🔧 Como Rodar o Projeto

### Frontend

1. Clone o repositório:

   ```bash
   git clone https://github.com/NunoLima10/hubdigital.git
   ```

2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Execute o frontend:
   ```bash
   pnpm run web:dev
   ```

### API

1. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Instale as dependências da API:

   ```bash
   cd api && pnpm install
   ```

3. Execute as migrações do banco de dados:

   ```bash
   pnpm run db:migrate
   ```

4. Inicie a API em modo desenvolvimento:
   ```bash
   pnpm run dev
   ```

## 📚 Documentação da API

A documentação da API está disponível em:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## ✅ TODO

- [x] Set up `README.md` com visão geral do projeto
- [x] Criar guia de contribuição (`CONTRIBUTING.md`)
- [ ] Definir modelo de dados e criar diagrama em **DBML**
- [ ] Implementar autenticação na API
- [ ] Desenvolver endpoints principais
- [ ] Configurar pipeline CI/CD
