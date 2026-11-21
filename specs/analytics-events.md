# Analytics de produto (PostHog)

Estado: **setup feito, eventos por instrumentar.** Este documento é o plano de
tracking: que eventos capturar, de onde (web ou API), com que propriedades e
que perguntas respondem.

## Princípios

1. **O que as pessoas fazem, não quem são.** O `distinct_id` é o id da conta.
   Nunca enviar nome, email, handle, texto de comentários, descrições ou
   qualquer texto livre escrito por utilizadores. Só ids, enums e números.
2. **Factos de negócio vêm da API.** Tudo o que a API já sabe (projeto
   publicado, comentário, upvote, convite aceite) é capturado no backend
   (`api/src/lib/analytics.ts`): ad blockers não o bloqueiam e a futura app
   móvel ganha os mesmos eventos sem código extra.
3. **O browser só captura o que só o browser vê.** Pageviews, passos de um
   formulário, cliques em CTAs, filtros, partilhas (`web/src/lib/posthog.ts`).
4. **Os contadores para makers continuam em `project_events`.** As stats que o
   maker vê no dashboard são nossas (web + app, ver `project-pages-and-metrics.md`).
   O PostHog serve a equipa: funis, retenção, aquisição, comportamento.
5. **Convenção de nomes:** `objeto_verbo_no_passado` em snake_case
   (`project_published`, `comment_created`). Propriedades em snake_case.
   Todos os eventos levam `app` (`web` | `api`).

## O que já está montado

| Onde | Ficheiro | O quê |
| --- | --- | --- |
| Web | `web/src/lib/posthog.ts` | Init lazy (só browser), `track`, `identifyUser`, `resetUser`. Sem `VITE_APP_POSTHOG_KEY` não faz nada. |
| Web | `web/src/components/analytics/posthog-analytics.tsx` | Montado no `AppProvider`: inicia o SDK, identifica no login (só id + `role` + `onboarded`), faz reset no logout. |
| Web | `web/src/server.ts` | Reverse proxy `/ingest/*` → PostHog EU (sem cookies do site, com o IP do visitante para geo). |
| API | `api/src/lib/analytics.ts` | Cliente `posthog-node` com batch; `analytics.capture(...)`, `setPersonProperties`, `shutdown` no `main.ts`. Sem `POSTHOG_API_KEY` ou em `test` não faz nada. |

Configuração do SDK web: `person_profiles: "identified_only"` (visitantes
anónimos não criam perfis), pageviews em navegação SPA (`history_change`),
`$pageleave`, autocapture ligado. O projeto PostHog já tem `anonymize_ips`
ativo e gravação de sessões desligada.

### Variáveis

```bash
# web/.env (produção: no build)
VITE_APP_POSTHOG_KEY=phc_...
VITE_APP_POSTHOG_HOST=/ingest
VITE_APP_POSTHOG_UI_HOST=https://eu.posthog.com

# api/.env
POSTHOG_API_KEY=phc_...        # o mesmo token público do projeto
POSTHOG_HOST=https://eu.i.posthog.com
```

Um projeto PostHog por ambiente (dev, staging, produção): cada um usa o
token e o `POSTHOG_PROJECT_ID` do seu projeto. Os eventos não levam marca de
ambiente.

## Catálogo de eventos

Legenda da origem: **API** = `analytics.capture` no serviço/controller;
**Web** = `track()` no componente.

### 1. Registo e login

| Evento | Origem | Propriedades | Onde ligar |
| --- | --- | --- | --- |
| `user_signed_up` | API | `method` (`email` \| `google`) | `databaseHooks.user.create.after` em `api/src/lib/auth.ts` |
| `user_signed_in` | API | `method` | `databaseHooks.session.create.after` |
| `sign_up_viewed` / `sign_in_viewed` | auto (`$pageview`) | — | já coberto |
| `auth_failed` | Web | `form` (`sign_in` \| `sign_up`), `reason` (código do erro, não a mensagem) | `use-auth-submit.ts` |

Responde: quantos registos por dia/semana, Google vs email, onde as pessoas
desistem do formulário.

### 2. Onboarding

| Evento | Origem | Propriedades |
| --- | --- | --- |
| `onboarding_started` | Web | — |
| `onboarding_step_completed` | Web | `step` (0..n), `question` (`profile` \| `objective` \| `location` \| `found_us`), `answer` (valor do enum) |
| `onboarding_completed` | API (`POST /users/onboarding`) | `profile`, `objective`, `location_type` (`cv` \| `diaspora`), `island` ou `country` (só nível país/ilha), `found_us` |
| `eligibility_confirmed` | API (`PUT /users/me/eligibility-confirmation`) | — |
| `onboarding_cta_clicked` | Web (ecrã de sucesso) | `cta` (`publish` \| `explore`), `suggested` (bool: era o botão em destaque), `objective` |

E em `onboarding_completed`, gravar as mesmas respostas como **propriedades
da pessoa** (`profile`, `objective`, `found_us`, `location_type`). São
categorias, não dados pessoais, e permitem cortar todos os outros insights por
perfil ("estudantes publicam menos?", "quem veio pelo LinkedIn fica mais?").

Responde: funil registo → onboarding concluído, em que pergunta se desiste,
de onde vêm as pessoas (`found_us`), e o que fazem a seguir ao onboarding
(publicar vs explorar, e se seguem o botão sugerido).

### 3. Submissão e publicação de projetos

| Evento | Origem | Propriedades |
| --- | --- | --- |
| `project_submission_started` | Web | `from_draft` (bool) |
| `project_submission_step_viewed` | Web | `step` (0–4), `direction` (`forward` \| `backward`) |
| `project_submission_validation_failed` | Web | `step`, `fields` (nomes dos campos, sem valores) |
| `project_draft_restored` | Web | `step` |
| `project_created` | API (`POST /projects`) | `project_id`, `categories`, `platforms`, `stage`, `pricing`, `source_model`, `ai_involvement`, `has_logo`, `gallery_count`, `has_video`, `link_kinds`, `quality_score` |
| `project_published` | API (`POST /projects/:id/publish`) | `project_id`, `needs_review` (bool), `is_first_project` |
| `project_approved` / `project_rejected` | API (admin) | `project_id`, `hours_in_review` |
| `project_updated` | API (`PATCH /projects/:id`) | `project_id`, `fields_changed` (nomes) , `goes_to_review` |
| `project_deleted` | API | `project_id`, `status` |

Pessoa: `has_published_project`, `projects_count`.

Responde: quantos começam e não acabam, em que passo do wizard se perde mais
gente, que tipos de projeto são publicados (categoria, plataforma, estágio,
open source, uso de IA), tempo de revisão da moderação, relação entre
`quality_score` e aprovação.

### 4. Descoberta e visitas a projetos

| Evento | Origem | Propriedades |
| --- | --- | --- |
| `$pageview` | auto | URL, referrer, UTM, país |
| `project_viewed` | Web (página de detalhe) | `project_id`, `project_slug`, `from` (`home` \| `ranking` \| `map` \| `search` \| `maker_profile` \| `external` \| `share`), `categories` |
| `project_list_filtered` | Web | `period`, `sort`, `category`, `has_query` |
| `search_performed` | Web | `query_length`, `results_count` (não o termo; se quisermos os termos, rever com a política de privacidade) |
| `map_project_opened` | Web | `project_id`, `island` |
| `ranking_viewed` | auto (`$pageview`) | — |
| `maker_profile_viewed` | Web | `maker_id`, `is_own` |
| `project_link_clicked` | API (`GET /go/:linkId` e `POST /links/:id/click`) | `project_id`, `link_kind`, `surface` (`detail` \| `card` \| `map`) |
| `project_shared` | Web | `project_id`, `channel` (`copy_link` \| `native` \| `whatsapp` \| …) |

**Projetos mais visitados:** trend de `project_viewed` com breakdown por
`project_slug` (gratuito). Para analytics *por projeto* como entidade
(retenção de visitantes de um projeto, etc.) existe o Group Analytics do
PostHog (grupo `project`), mas é um add-on pago; o breakdown por propriedade
chega para começar. Os números públicos/maker continuam a vir de
`project_events`.

Responde: que projetos e categorias atraem mais, de onde vem o tráfego para
cada projeto, taxa visita → clique no site do projeto, mapa vs lista vs
ranking como superfície de descoberta.

### 5. Interações da comunidade

| Evento | Origem | Propriedades |
| --- | --- | --- |
| `project_upvoted` / `project_upvote_removed` | API | `project_id`, `is_own_project` |
| `project_favorited` / `project_unfavorited` | API | `project_id` |
| `comment_created` | API | `project_id`, `is_reply`, `length_bucket` (`<50` \| `50-200` \| `>200`), `is_project_member` |
| `comment_edited` / `comment_deleted` | API | `comment_id`, `project_id` |
| `report_submitted` | API (`POST /reports`) | `target_type`, `reason` |
| `announcement_created` | API | `project_id`, `kind` (`presentation` \| `first_release` \| `major_update`) |
| `announcement_voted` | API | `announcement_id`, `project_id` |
| `project_member_invited` | API | `project_id`, `role` |
| `project_invitation_answered` | API | `project_id`, `accepted` (bool) |
| `project_member_removed` | API | `project_id`, `left_by_self` |

Responde: quantas pessoas interagem (e não só veem), rácio
upvotes/comentários por visita, quem comenta (makers vs visitantes), saúde da
moderação (reports por semana), adoção das equipas de projeto.

### 6. Perfil e gamificação

| Evento | Origem | Propriedades |
| --- | --- | --- |
| `maker_profile_updated` | API (`PATCH /makers/me`) | `fields_changed` |
| `avatar_uploaded` | API | — |
| `badge_earned` | API (badges-services) | `badge_key` |
| `badge_featured` | API (`PUT /badges/me/featured`) | `badge_key` |
| `theme_changed` | Web | `theme` |

Pessoa: `is_founding_member`, `badges_count`.

## Insights e dashboards a montar

1. **Funil de ativação:** `user_signed_up` → `onboarding_completed` →
   `project_submission_started` → `project_created` → `project_published`.
2. **Funil de engagement de visitante:** `$pageview` → `project_viewed` →
   (`project_upvoted` ou `comment_created` ou `project_link_clicked`) →
   `user_signed_up`.
3. **Retenção semanal** de quem fez `onboarding_completed`, por `profile`.
4. **Stickiness:** quantos dias por semana alguém faz um evento de interação.
5. **Top projetos:** `project_viewed` e `project_link_clicked` por
   `project_slug`, semanal.
6. **Aquisição:** `found_us` (pessoa) + UTM/referrer dos pageviews.
7. **Saúde da submissão:** passo do wizard com mais abandono, tempo médio de
   revisão, taxa de rejeição.

## "Levar utilizadores a entrar num projeto"

Há três caminhos, do mais simples ao mais pesado:

1. **No próprio produto (recomendado):** usar os nossos `project_events` para
   uma secção "Em alta esta semana" / "Mais visitados" na home, e sugestões
   de projetos da mesma categoria na página de detalhe. Funciona para a app
   móvel também.
2. **Cohorts + mensagens in-app do PostHog:** p. ex. cohort "viu o mesmo
   projeto 3+ vezes e não votou/comentou" → survey ou product tour a sugerir
   seguir o projeto ou entrar na equipa. Não precisa de email.
3. **Workflows do PostHog (email):** exigiria enviar o email para o PostHog,
   o que contraria o princípio 1. Só com decisão explícita e atualização da
   política de privacidade.

## Privacidade e consentimento (implementado)

Ao contrário do Umami, o PostHog com cookies guarda um identificador no
browser (`ph_*`). Decisão: **banner de consentimento + modo cookieless quando
a pessoa recusa ou ainda não escolheu.**

- `web/src/components/analytics/cookie-consent-banner.tsx`: banner com
  "Recusar" e "Aceitar" com o mesmo peso. Só aparece se houver
  `VITE_APP_POSTHOG_KEY`.
- `web/src/lib/analytics-consent.ts`: a escolha fica em
  `localStorage["hubdigital-analytics-consent"]` (armazenamento estritamente
  necessário). É nossa e não do PostHog porque `posthog.reset()` no logout
  apaga o registo de consentimento do SDK.
- `web/src/lib/posthog.ts`: `cookieless_mode: "on_reject"` +
  `opt_out_capturing_by_default: true`. Sem resposta ou com recusa = eventos
  sem cookies nem storage (`distinct_id` `$posthog_cookieless`, hash diário
  no servidor do PostHog). Aceitar = cookies normais. Cada escolha gera
  `analytics_consent_updated` (`consent`).
- Rodapé: "Preferências de cookies" esquece a escolha e volta a mostrar o banner.
- `web/src/routes/privacidade.tsx`: secções 6 e 7 já mencionam o PostHog (UE).

**Obrigatório no PostHog:** ativar o modo cookieless nas definições do projeto
(opção "cookieless server hash mode"). Sem isso, os eventos
de quem recusa ou não respondeu são descartados.

## Estatísticas públicas na home (PostHog Query API)

Estado: **integração base feita; queries finais por escolher.**

A sidebar da home mostra números do próprio Hub Digital (transparência de
projeto open source). Os números vêm da API de queries do PostHog, lidos pelo
backend — nunca pelo browser, porque a chave pessoal dá acesso a todos os
dados do projeto PostHog.

### Arquitetura

```
browser ──GET /v1/site-stats──▶ API ──▶ site_stats_snapshots (Postgres)
                                          │  snapshot com mais de 5 min?
                                          ▼  (um só pedido, em segundo plano)
                     POST https://eu.posthog.com/api/projects/:id/query/
                     Authorization: Bearer <POSTHOG_PERSONAL_API_KEY>
                     { query: { kind: "HogQLQuery", query, values }, name }
```

- `api/src/lib/posthog-query.ts`: cliente mínimo (fetch + timeout 8 s, sem SDK).
- `api/src/db/schemas/site-stats.ts`: tabela `site_stats_snapshots`, uma
  linha por dia de Cabo Verde (`day`, `payload` jsonb, `fetched_at`,
  `refreshing_at`). O último refresh de cada dia fica como snapshot desse dia,
  por isso a tabela também é histórico.
- `api/src/modules/site-stats`: leitura da DB, refresh e rota pública
  `GET /v1/site-stats`.
- `packages/shared/src/site-stats.ts`: schema da resposta, partilhado com a web.
- `web/src/modules/project-list/components/home-sidebar/site-stats-card.tsx`:
  card "Estatísticas <ano>" no topo da sidebar, acima de "Inovadores de Cabo
  Verde": duas caixas (visitantes, páginas vistas) do ano corrente, um ícone
  (i) com a explicação, e a linha "Desde <mês ano>: X visitantes · Y páginas
  vistas". Skeleton enquanto carrega; escondido quando a API devolve
  `data: null`.

**Servido sempre da nossa base de dados.** O PostHog é só a fonte:

| Situação | O que a API faz |
| --- | --- |
| Snapshot com menos de 5 min | devolve-o, sem PostHog |
| Snapshot com mais de 5 min | devolve-o **na hora** e atualiza em segundo plano |
| Nenhum snapshot (primeira vez) | espera pelo PostHog e guarda |
| PostHog falha | mantém o último snapshot; volta a tentar após 5 min |

- **Um só pedido ao PostHog** por intervalo, mesmo com muitos visitantes ou
  várias instâncias da API: quem quer atualizar "reclama" a linha de hoje com
  um upsert condicional (`refreshing_at` vazio ou com mais de 5 min, e
  `fetched_at` com mais de 5 min). Só quem ganha faz a query.
- Uma falha deixa a reclamação ativa até expirar, para não martelar o PostHog
  enquanto está em baixo.
- Um memo em memória de 60 s evita uma leitura à DB por cada visita à home.
- O intervalo é `REFRESH_INTERVAL_MS` em `site-stats-services.ts` (5 min).
- Deploys e reinícios já não esvaziam o card nem disparam queries.

**Ambiente:** conta todos os pageviews do projeto em `POSTHOG_PROJECT_ID`.
Como cada ambiente tem o seu projeto, dev e staging não inflacionam a
produção.

### Variáveis (API)

```bash
POSTHOG_PERSONAL_API_KEY=phx_...   # chave pessoal, scope só "query:read"
POSTHOG_PROJECT_ID=351277
POSTHOG_APP_HOST=https://eu.posthog.com   # host privado (≠ eu.i.posthog.com)
```

Criar a chave com **apenas** o scope `query:read` e restrita ao projeto Hub
Digital. Nunca a expor ao browser (não é `VITE_APP_*`).

### Queries implementadas (base)

Uma só query sobre `$pageview` responde aos dois períodos:

| Campo | Expressão | Nota |
| --- | --- | --- |
| `yearToDate.visitors` | `uniqExactIf(person_id, timestamp >= toStartOfYear(now()))` | visitantes únicos este ano |
| `yearToDate.pageviews` | `countIf(timestamp >= toStartOfYear(now()))` | páginas vistas este ano |
| `yearToDate.homeViews` | idem com `$pathname = '/'` | views da página principal (ainda não mostrado) |
| `allTime.*` | as mesmas sem filtro de data | totais desde o início |
| `allTime.since` | `min(timestamp)` | mês do primeiro pageview |

A parte "desde sempre" lê o histórico inteiro, mas corre uma vez a cada cinco minutos.

**Atenção aos visitantes únicos:** quem recusa cookies (ou não respondeu) é
contado com um hash **diário**. Num intervalo de 30 dias, a mesma pessoa
anónima sem cookies que volte em dias diferentes conta várias vezes. Para um
número mais honesto há duas alternativas: "visitantes por dia (média)" ou
um intervalo curto (7 dias).

### Outras estatísticas sugeridas (por escolher)

| Estatística | Fonte | Porquê é interessante |
| --- | --- | --- |
| **Países de onde nos visitam** (`uniq(properties.$geoip_country_code)`) | PostHog | Mostra o alcance da diáspora; "visto em 14 países" é forte para a missão. |
| **Ilhas/cidades de Cabo Verde** (`$geoip_city_name` com país `CV`) | PostHog | Quantas ilhas usam a plataforma. Precisão de geo-IP em CV é limitada; validar antes. |
| **Online agora** (visitantes nos últimos 5 min) | PostHog | Dá vida à home. Precisa de cache curto (1 min); gasta mais orçamento. |
| **Visitas a projetos** (`$pathname LIKE '/projects/%'`) ou `project_viewed` | PostHog ou `project_events` | "X visitas a projetos este mês" — prova de valor para makers. Preferir `project_events` (já é nosso e não gasta orçamento). |
| **Cliques para os sites dos projetos** | `project_events` (`visit`) | Tráfego que o Hub Digital envia aos projetos. |
| **Projetos publicados / makers / comentários** | Base de dados | Números de comunidade; sem PostHog. |
| **Projetos mais vistos da semana** | `project_events` | Lista "Em alta" (ver secção acima sobre levar utilizadores a projetos). |

Sugestão para o card: **visitantes (30 d)**, **países**, **visitas a
projetos (30 d)** e **projetos publicados**. Mistura alcance (PostHog) com
impacto na comunidade (dados nossos).

## Ordem sugerida

1. Credenciais em produção + ativar o modo cookieless no projeto PostHog.
2. Eventos da API das secções 1, 2, 3 e 5 (são poucos pontos de código e
   cobrem o funil inteiro).
3. Eventos web: onboarding, wizard de submissão, `project_viewed` com `from`.
4. Dashboards da lista acima.
5. Gamificação, partilha e "levar a entrar em projetos".
