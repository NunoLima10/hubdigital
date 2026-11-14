# Granular category taxonomy

Implemented: 12 October 2026, following the user's acceptance of specific categories organized into browsing groups.

Groups organize the picker and are not selectable project memberships. Choose one primary category and optionally one or two secondary categories; filling all three is never required. Search works without accents and includes curated synonyms. Moderator-created categories are selectable under Outras categorias until curated into a group.

## Tecnologia

Ferramentas para Programadores, Inteligência Artificial, Dados & Análise, Cibersegurança, Privacidade, APIs, Integrações, Automação, No-code e low-code, Infraestrutura cloud, DevOps, Bases de dados, Testes de software, Monitorização, Alojamento web, Machine learning, Agentes de IA, Visão computacional, Tecnologia de voz, Blockchain, Internet das coisas, Robótica.

## Trabalho

Produtividade, Colaboração, Marketing, Vendas, Design, Emprego, Gestão de pessoas.

## Vida local

Finanças, Pagamentos, Comércio eletrónico, Serviços locais, Transportes, Logística, Turismo, Imobiliário.

## Serviços públicos e bem-estar

Governo, Cidadania, Educação, Saúde, Bem-estar.

## Cultura e comunidade

Comunidades, Impacto social, Media, Cultura, Música, Línguas, Jogos, Desporto.

## Ambiente e produção

Agricultura, Pesca, Ambiente, Energia, Água.

## Outras categorias

Outro.

## Data and migration

The shared category catalog is the source for seeds, grouping and search aliases. Migration `0022_granular_categories` inserts new sectors and simplifies existing labels. Existing category IDs remain stable where their keys are retained. Existing development memberships are not automatically expanded to all sectors from an old combined label; builders can refine those choices.

The broad Economia do mar umbrella is retired. Existing development primary selections using it move to Outro, its secondary memberships are removed, and duplicate primary/secondary references are removed before deletion. Fishing, transport, environment and other specific choices express actual project purposes. Project category limits, filtering and moderation counts keep the milestone 3 behavior.

Examples: Turismo + Comércio eletrónico + Pagamentos; Pesca + Comércio eletrónico; Educação + Línguas; Produtividade + Colaboração.

The broader Product Hunt screenshot UI refinements remain specified separately and are not part of this taxonomy delivery.

## Verification

Migration 0022 applied to the development database. All 189 API checks verified: the full run exposed an existing Monday-boundary fixture using eight days ago as “last week”; it was corrected to seven days and the 65-test project/taxonomy subset passed on rerun. Shared/API/web builds and picker ESLint passed. After the local API became available again, browser checks confirmed all seven group headings, 38 remaining choices for a project with one selected category, Kriolu search resolving to Línguas, and no horizontal overflow at 390 px or 1280 px. The local public API returns all 39 choices. The edit form was canceled without changing the project.

## Technology expansion — 13 October 2026

Added 17 technology choices (56 total, including 22 in Tecnologia). Migration `0027_technology_categories` inserts these without changing existing category IDs or project memberships. Seeds use the same shared catalog.

The compact picker now shows up to 12 suggestions, led by AI, developer tools, APIs, automation, no-code, data, cloud and cybersecurity, rather than the first six alphabetical categories. Search still covers all categories. “Ver todas as categorias” has a grid icon; the full browser keeps every group and the existing one-primary/two-secondary selection behavior.

Verification: migration applied; the live API returns 56 categories. Three taxonomy tests passed, along with web TypeScript and picker ESLint. Browser checks confirmed 12 technology-focused quick suggestions, the grid icon, 22 technology choices and all 56 options in the dialog, and Kubernetes search resolving to DevOps. The local API needed a restart after its development watcher left requests pending; responses worked normally afterwards. The 390 px category dialog also resolved Kubernetes to DevOps with no horizontal overflow. No project was saved or published during this check.
