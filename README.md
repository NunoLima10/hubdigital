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

## 🛠️ Tecnologias (Para MVP)

- **Frontend:** [React](https://reactjs.org) e [Mantine UI](https://mantine.dev/getting-started/)
- **Backend:** [PocketBase](https://pocketbase.io)
- **Banco de dados:** SQLite (via PocketBase)
- **Deploy:** Uma opção local se possivel ou Cloudflare /Netlify/ Render/ Railway

##  Como rodar o projeto localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/NunoLima10/hubdigital.git
   ```
2. Instale as dependências usando ou pnpm :
   ```bash
   pnpm install
   ```
3. Executar web:
   ```bash
   pnpm run web:dev
   ```

## ✅ TODO

- [x] Set up `README.md` com visão geral do projeto
- [x] Criar guia de contribuição (`CONTRIBUTING.md`)
- [ ] Definir modelo de dados e criar diagrama em **DBML**
- [ ] Fazer a integração inicial do frontend com a API do PocketBase
