# Contribuindo com o Hub Digital

Olá! 👋 Ficamos muito felizes que você quer colaborar com o **Hub Digital**! Este projeto é feito para e pela comunidade tech cabo-verdiana.

## 🇨🇻 Adicionar um projeto ao diretório

Há duas formas de adicionar um site, app ou plataforma feito em Cabo Verde:

- **Sem código:** preencha o formulário [Submeter projeto](https://github.com/NunoLima10/hubdigital/issues/new?template=submit_project.yml) e um maintainer trata do resto.
- **Com Pull Request:**
  1. Adicione uma entrada a [`web/src/data/projects.json`](web/src/data/projects.json):

     ```json
     {
       "slug": "meu-projeto",
       "name": "Meu Projeto",
       "tagline": "O que faz, numa frase (até 120 caracteres).",
       "website": "https://meuprojeto.cv/",
       "iconUrl": "/logos/meu-projeto.webp",
       "category": "Saúde",
       "tags": ["SaaS", "B2C"],
       "island": "Santiago",
       "foundedYear": 2024,
       "makers": [{ "name": "Nome", "url": "https://linkedin.com/in/..." }],
       "github": "https://github.com/...",
       "addedAt": "2026-10-21",
       "upCount": 0
     }
     ```

     Obrigatórios: `slug`, `name`, `tagline`, `website`, `category`, `tags`, `addedAt` e `upCount` (sempre `0`). As categorias e ilhas válidas estão em [`project.ts`](web/src/features/project-list/types/project.ts).

  2. (Opcional) Coloque o logo, quadrado e em `.webp`, em `web/public/logos/`. Sem logo, são mostradas as iniciais.
  3. Valide antes de abrir o PR:

     ```bash
     pnpm projects:validate
     ```

Critérios: o projeto tem de ter sido criado em Cabo Verde ou por cabo-verdianos e estar acessível publicamente. Todas as semanas, uma GitHub Action verifica se os sites continuam online. Os que deixam de responder são marcados com `"status": "offline"`.

## 💻 Contribuir com código

1. Fork este repositório e crie sua branch::

   ```bash
   git clone https://github.com/seu-usuario/hubdigital.git
   ```

2. Faça suas modificações desejadas.
   ```bash
   git commit -m "feat: nova funcionalidade"
   ```
3. Abra um Pull Request com a descrição do que foi alterado ou adicionado.

### Regras de contribuição

Escreva código limpo, reutilizável

Evite deixar console.log no código de produção.

Use nomes descritivos para variáveis e funções.

Commits devem seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
