# Project submission and discovery audit

Reviewed: 11 October 2026. Product: HubDigital, for Cabo Verde builders and the diaspora.

Follow-up: [Product Hunt screenshot inspiration, 12 October 2026](./submission-product-hunt-inspiration.md) records the user's newer UI/copy direction, reference images and future data decisions. Use it together with the roadmap to distinguish implemented work from proposals. The later [granular taxonomy](./category-taxonomy.md) supersedes the broad combined labels after user acceptance.

## 1. Recommended direction

Make HubDigital a permanent directory of projects with an optional launch and feedback layer. Builders should be able to share a working product, an existing business tool, a student prototype, a repository, or an early idea without inventing answers to business questions.

The first redesign should do six things:

1. Replace required “Website” with a conditional, typed primary destination. A website is one possible destination; an app store, repository, demo, or contact route can also be useful.
2. Separate **availability**, **development stage**, **source licensing**, and **publication status**. They answer different questions.
3. Allow **one primary category and up to two secondary categories**. Remove implementation and licensing labels from the sector taxonomy.
4. Save incomplete drafts at every step. Validate publication readiness on the server when the builder submits for publication.
5. Separate **where the team builds**, **where the project serves users**, and **its connection to Cabo Verde**. Support worldwide locations with optional map pins and explicit precision.
6. Separate **project publication** from **launch announcements**, so an established product can join the directory honestly.

These are proposed product decisions, not a requirement to copy either reference platform. No compatibility layer is needed: redesign the schema and regenerate development data together. Do not reset the database as part of this audit.

## 2. What was inspected and limits

### Local evidence

- Live authenticated submission at `http://localhost:5173/dashboard/submit`, including the description and category steps.
- Live map at `/map`, public homepage, and project page `/projects/agora-me`.
- Shared Zod contracts, Drizzle project schema, category seed, location contracts, creation/update/publication services, moderation approval, onboarding gate, editing UI, public project detail, and analytics implementation.
- Read-only API requests for the project list. No test project was submitted, no votes/comments were added, and no external accounts were created.
- Existing uncommitted changes were present before the audit. This report does not modify them.

### External evidence

- Product Hunt homepage and [HireKey project page](https://www.producthunt.com/products/hirekey), inspected in the collaborative browser.
- Product Hunt's official [submission instructions](https://help.producthunt.com/en/articles/479557-how-to-post-a-product), [launch guide](https://help.producthunt.com/en/articles/17350772-launch-guide), and [unreleased-product policy](https://help.producthunt.com/en/articles/484932-can-i-submit-an-unreleased-product).
- OpenLaunch homepage and [Planet Cert project page](https://open-launch.com/projects/planet-cert), inspected in the browser.
- OpenLaunch submission route redirects to sign-in. Its form and data model were therefore reviewed in the [public repository](https://github.com/openlaunch-org/Open-Launch), rather than claiming to have completed its authenticated flow.

Product Hunt page text and links were inspectable, but its screenshot snapshots failed in the preview client. Local snapshots worked. Findings about the references describe observed pages and documented/source behavior; they are not usability-test results or a guarantee that the deployed OpenLaunch form matches its current main branch exactly.

## 3. Current findings, ordered by impact

| Finding | Evidence | Impact / recommendation |
|---|---|---|
| Website is mandatory everywhere | `packages/shared/src/project-schema.ts:50`; `api/src/db/schemas/projects.ts`; ProjectForm | Repository-only, app-store-only, and idea projects cannot describe their actual destination clearly. Introduce typed links and conditional publication rules. |
| “Acesso neste lançamento” combines incompatible concepts | `packages/shared/src/project-options.ts:19`; submit `options.ts` | An open-source public beta cannot select both facts; a stable proprietary product has no explicit availability option. Split availability from source licensing. |
| Category is singular in storage, form, filters, and display | `project-schema.ts:69`; ProjectCategories; list services; detail sidebar | A tourism booking tool must sacrifice either tourism or commerce. Add category memberships and one primary selection. |
| Drafts require a complete submission | submit `context/sumbmit-form.tsx:136`; `step-layout.tsx:40`; create route uses full projectBodySchema | “Guardar rascunho” appears only at review and executes full validation. Builders cannot save halfway through. Add a partial draft contract and persistent save. |
| Draft progress lives in component state until creation | SumbmitProvider/useForm; no persistence in this flow | Refresh, session expiry, or navigation can discard unsaved work. Add autosave and recovery. |
| Publication takes two requests without retained retry identity | SumbmitProvider creates, then publishes in onSuccess | If publish fails after create, the form stays populated and a retry can create another record. Retain the created project ID and retry the failed transition. |
| Every project must answer pricing, business model, audience, stage, access, platform, category, and location | projectBodySchema; ProjectCategories; canProceed | Encourages fake answers for prototypes and noncommercial projects. Keep only discovery-critical questions mandatory; allow “not decided” and “not applicable” where truthful. |
| Publication date is presented as product launch date | `projects-services.ts:567`; detail sidebar “Lançamento” | An old product added today appears newly launched. Model original release date separately and label publication accurately. |
| Moderation success copy can claim a pending project is live | `use-project-actions.ts` always says “Já está no ar!” although publish response contains status | Show “Enviado para revisão” for pending, and “Publicado” only for a public page. |
| Country support is a short fixed diaspora enum with “other” | `packages/shared/src/location-options.ts` | Other countries cannot be identified, filtered, or mapped properly. Use a full country reference and searchable selection. |
| Location has no coordinates or abroad city | location-schema; Drizzle projects | Cannot show a chosen location in Portugal or a precise place locally. Add typed location records with precision and visibility. |
| Map excludes foreign projects and constrains movement to Cabo Verde | `project-map-view.tsx:14`; `cabo-verde-map.tsx:68` | Diaspora projects disappear. Offer Cabo Verde and worldwide views using the same data. |
| Project markers use ID-based offsets from island centers | `project-map/islands.ts`, projectPosition | Positions are illustrative, not actual addresses. Show regional clusters for approximate records and real pins only for explicit locations. |
| Map loads only the first 100 globally ranked projects | `project-map-view.tsx:10` | As inventory grows, lower-ranked local projects and whole regions can disappear before filtering. Use a map query or complete pagination, not a leaderboard slice. |
| Analytics count website clicks already, but lack destination detail | trackProjectEvent; project_events daily buckets | Extend the existing implementation. Do not describe clicks as a missing feature or as confirmed visitors to the external site. |
| Homepage month filter fails in the running environment | API returns 400 for `period=this_month`; shared source includes it, shared/dist excludes it | Confirmed build drift. Rebuild shared package before starting dependent apps, and add a start/build check for contract freshness. |
| Raw submitted description HTML reaches rendering | toRowValues persists description; detail/review use dangerouslySetInnerHTML; no sanitizer found in inspected API path | Client editor output is not a server trust boundary. Sanitize allowed rich text on the server or store validated structured content and render safely. Exploit was not attempted. |
| Live published edits bypass a new review in the inspected update service | updateProject directly updates an owned row | Define review policy for changed destinations/content. A reviewed listing should not silently become an unrelated promotion. |

Existing strengths worth retaining: shared contracts; gallery upload keys; gallery ownership checks; transactional project/gallery updates; stable slugs with collision handling; owner-only draft visibility; moderation reasons; favorites, comments and votes; bot/owner exclusions in analytics; Cabo Verde calendar time in statistics and weekly ranking.

There are already **22 seeded categories**, including agriculture, government, education, health, tourism, and environment. The main problem is their structure and selection rules, not simply a lack of labels.

## 4. What the reference platforms contribute

### Product Hunt

Its documented submission supports a primary product link, additional download links, maker attribution, media, price information, a first maker comment, and draft/scheduling behavior. These are useful patterns for HubDigital's project introduction and actionable links. [Official posting instructions](https://help.producthunt.com/en/articles/479557-how-to-post-a-product).

The launch guide specifies up to three topics and distinguishes a launch's leaderboard moment from its permanent product home. Adopt the limited multiple-topic pattern and the project/announcement distinction. Keep the existing local weekly cadence unless actual community activity justifies a different one. [Official launch guide](https://help.producthunt.com/en/articles/17350772-launch-guide).

The inspected HireKey page displays overview/reviews/alternatives/built-with/forum navigation, launch tags, pricing information, team attribution, follow/save/share actions and similar products. Team attribution, related projects, and a clearly visible primary action are useful near-term improvements; reviews, large forums, and recommendation infrastructure can wait. [Observed product page](https://www.producthunt.com/products/hirekey).

Product Hunt prioritizes usable products and restricts prelaunch homepage eligibility. HubDigital should deliberately allow ideas and prototypes in a clearly labeled community directory while reserving the launch ranking for something users can meaningfully try. [Unreleased-product policy](https://help.producthunt.com/en/articles/484932-can-i-submit-an-unreleased-product).

### OpenLaunch

The inspected source has a project/category junction table. Its form permits up to three categories, optional repository/social links, technology tags, supported platforms, and a launch-date step. It also checks whether a website URL already exists. These are concrete implementation references, especially the category join and duplicate warning. [Schema](https://github.com/openlaunch-org/Open-Launch/blob/main/drizzle/db/schema.ts), [submission form](https://github.com/openlaunch-org/Open-Launch/blob/main/components/project/submit-form.tsx).

The source still requires a website, has mandatory technology tags in step validation, and integrates commercial launch plans. Those requirements would create avoidable friction here. Use an optional technology stack and a similarity warning rather than an unconditional duplicate-domain prohibition. The inspected Planet Cert page gives categories, publisher, launch date, platform, price, technology stack and a prominent visit action. [Observed project page](https://open-launch.com/projects/planet-cert).

Neither reference replaces the need for a local relevance model, diaspora geography, language information, or support for community/student projects.

## 5. Define the concepts before changing fields

| Concept | User question | Recommended values |
|---|---|---|
| Submission intent | “O que queres partilhar?” | Add an existing project; announce a first release; announce a significant update; share work in progress. Treat as a flow choice, not a permanent sector. |
| Project stage | “Em que fase está o projeto?” | idea; building; prototype; live; paused; discontinued. “MVP”, “growth” and “maintenance” need not be mandatory taxonomy distinctions. |
| Availability | “Como as pessoas podem experimentar?” | not_available; waitlist; invite_only; public_beta; available; unavailable. |
| Source licensing | “O código está disponível?” | open_source; source_available; proprietary; not_applicable; not_disclosed. Optional repository and license identifier. A public repository alone does not prove an open-source license. |
| Pricing | “Como se paga para usar?” | free; freemium; paid; contact_for_quote; not_decided; not_applicable. Trial availability is an optional separate flag. |
| Audience | “Para quem é útil?” | Optional multiple audiences; plain-language labels. Rename audienceStage to audiences. |
| Submission state | “Onde está a minha submissão?” | draft; pending_review; changes_requested; published; rejected; withdrawn. Internal workflow, not a public product maturity badge. |
| Moderation visibility | “Pode aparecer publicamente?” | visible/hidden with reason and audit trail, separate from project stage. |
| Announcement state | “Quando aparece o anúncio?” | draft; pending_review; scheduled; published; cancelled. Optional layer. |

Examples: a stable proprietary app is `live + available + proprietary`; an open-source beta is `prototype/live + public_beta + open_source`; an established project added today is `live`, with an optional historical first-release date and no automatic announcement.

Keep B2B/B2C/B2G only as optional “Tipo de cliente”, expressed as “Empresas”, “Pessoas”, “Entidades públicas”. Remove nonprofit from that enum: nonprofit is an organization/business characteristic and can serve any of those customers. Do not require formal company registration or a revenue model.

## 6. What data to collect and display

“Required” below means required for publication, not for saving a draft.

| Field | Requirement | Reason / public presentation |
|---|---|---|
| Name | Required, trimmed, 2–120 characters | Main title; allow normal Portuguese/Kriolu diacritics. |
| Short description | Required, 10–200 characters | Cards and search results; show a live counter and concrete examples. Keep one short-description field; no additional mandatory duplicate tagline. |
| Detailed description | Optional | About section; prompt with problem, intended users, and current capabilities. Do not make builder story another required repetition. |
| Categories | Required, 1–3 distinct active categories | Primary on cards; all on detail and filter matches. |
| Stage | Required | Lets viewers distinguish idea/prototype/live honestly. |
| Availability | Required | Controls truthful action labels and launch eligibility. |
| Primary destination | Conditional | Required when the builder says users can try, request access, join a waitlist, download, or contact about a service. Optional for idea/building entries in the community directory. |
| Other destinations | Optional, initially cap at 8 | App stores, repository, docs, demo, pricing, contact, community, crowdfunding; visible under primary action. |
| Cabo Verde connection | Required, one or more reasons | Built in Cabo Verde; Cabo Verdean/diaspora maker; serves Cabo Verde; local collaboration. Small provenance section, not a nationality verification form. |
| Country/team base | Optional public location; ask clearly | Geography, not eligibility. Allow remote/distributed or undisclosed. Island required only when a CV-based builder chooses an island-level location; city/concelho optional. |
| Map pin | Optional | Public location selected explicitly; approximate by default. |
| Service area | Optional | Countries/islands served, global or online; distinct from team base. |
| Product languages | Optional multi-select | Useful local discovery: Portuguese, Kriolu/Cabo Verdean Creole, English, others. Separate UI language from product languages. |
| Price model | Optional; answer may be undecided/N/A | Compact detail badge; do not block ideas. |
| Price details | Optional, later | Starting amount, ISO currency such as CVE/EUR, billing period, pricing link, trial. Do not ask builders to maintain a full price catalog here. |
| Platforms | Conditional/optional | Required for a usable software product; optional for an idea, hardware prototype or service. Expand mobile to Android/iOS and support browser extensions, CLI, libraries, hardware/IoT. |
| License/repository | Optional | “Código” action and license badge, independent of price and availability. Generic repository URL supports GitLab/Codeberg as well as GitHub. |
| Logo | Optional | Provide an attractive letter/icon fallback; no branding prerequisite. |
| Gallery | Optional, up to 10 | Product evidence; include captions and alt text. Compress images and show retry state. |
| Video/demo | Optional | Keep YouTube support; accept an external demo link first. More embed providers can follow when needed. |
| Makers | One owner; optional collaborators | Team attribution with accepted invitations and roles. The submitter is not automatically every project's sole creator. |
| First release date | Optional date, not timestamp | Label “Disponível desde”. Unknown remains unknown; do not substitute today. |
| Help wanted | Optional multi-select + short note | Testers, feedback, contributors, collaborators, pilot customers, mentors. Display as a concrete invitation. |
| Tech stack | Optional, later | Secondary “Construído com” section; not a category or submission gate. |
| Launch/update details | Only when announcing | Title, what's new, maker introduction, planned date, optional demo/promotion. |

Keep ownership, moderation audit, upload metadata, metrics, and workflow timestamps internal. The owner dashboard shows publication/review state and actionable reasons; visitors see only meaningful project information.

### Destination policy

Replace websiteUrl/githubUrl with project_links, plus a primary-link relation. Choose a link type and generate a relevant action: **Experimentar**, **Instalar**, **Ver código**, **Ver demonstração**, **Entrar na lista**, or **Contactar**.

Accept HTTP(S) for external destinations; support contact through validated structured email/phone fields that generate mailto or a WhatsApp URL. Do not accept arbitrary executable URL schemes. Suggest `https://` when omitted and show the normalized result before saving. Avoid rejecting useful projects for not owning a domain.

For idea/building records without a destination, the page itself is the discovery destination, with “Dar feedback” as an internal action. Do not render a dead external button. For a waitlist or private beta, require a real signup/request route if one is advertised. For a discontinued project, remove or relabel stale actions and offer an archive/code link when available.

If the product policy later requires every public listing to have an external route, require **a destination**, not specifically a website. That is stricter than the recommendation above and would intentionally exclude some early projects.

## 7. Category redesign for Cabo Verde

Use broad sectors as categories, with a limited set of optional topics. Category answers “what problem/domain?”, platform answers “where does it run?”, license answers “can I use the code?”, and product format answers “what kind of thing?”.

Recommended initial categories (Portuguese UI labels):

| Group | Categories |
|---|---|
| Daily life and local economy | Turismo & Viagens; Comércio & Serviços locais; Transportes & Logística; Finanças & Pagamentos; Imobiliário & Habitação |
| Public and social impact | Educação & Aprendizagem; Saúde & Bem-estar; Governo & Cidadania; Comunidade & Impacto social; Ambiente, Energia & Água |
| Production and culture | Agricultura, Pesca & Economia do mar; Cultura, Música & Línguas; Media & Entretenimento; Jogos & Desporto |
| Work and digital tools | Produtividade & Colaboração; Ferramentas para Programadores; Dados & Inteligência Artificial; Design & Criatividade; Marketing & Vendas; Segurança & Privacidade; Emprego & Talento |
| Fallback | Outro, with an optional category suggestion for moderators |

These are proposed labels to validate with local builders, not claims about national market size. Existing education/tourism/agriculture/government categories can be reorganized rather than multiplied into dozens of empty destinations.

Move **SaaS** to an optional format/topic, **Código Aberto** to licensing, and **Mobile/Web/API** to platforms. AI can remain a category when it is the core offering; otherwise use an optional AI topic rather than forcing every AI-assisted project into it.

Candidate optional topics include booking, inter-island mobility, remittances, small-business management, fisheries, water efficiency, Kriolu learning, accessibility, low-bandwidth use, offline support, marketplace, open data and no-code. Introduce only topics that builders actually need. Store local-payment support as an optional capability rather than conflating it with “Fintech”.

Selection UX: searchable list, selected chips, “1 de 3 categorias”, and an explicit primary marker. First selection becomes primary with an easy “Tornar principal” action. Removing primary prompts a replacement or promotes the next selected category. Filtering a category matches any membership; counts use DISTINCT project IDs so multi-category projects are not duplicated.

Use stable keys, translated labels, short explanations, and moderator-controlled additions/merges. A category suggestion must not block saving or publication under Outro.

## 8. Submission experience

Use four clear sections with an always-visible save state; an initial intent choice can be an inline question rather than an additional screen.

1. **O projeto**: name, short description, stage, availability, destination. Detailed description/media are collapsible optional additions. Explain “Um site próprio não é obrigatório”.
2. **Descoberta**: 1–3 categories, primary category, optional platforms/languages/pricing/audiences. Put advanced business and technical details behind “Mais detalhes”.
3. **Equipa e ligação a Cabo Verde**: relevance, optional team base and service area, optional map pin, collaborators/help wanted. Clarify that overseas builders are welcome when the project has a stated local connection.
4. **Pré-visualizar e publicar**: reuse the real public card/detail components, show section edit links, list publication blockers, and distinguish directory publication from announcing a release.

Draft save should be available immediately, including before a category or URL is known. Auto-create a private draft on first meaningful input (or explicit save), retain its ID, debounce patches, and show “A guardar… / Guardado / Sem ligação — alterações por guardar”. Avoid creating blank database records for every visitor. Keep a local recovery copy for unacknowledged changes, with an explicit resume/discard choice.

A failed request must preserve inputs and uploaded media. Retry the same operation against the same project ID. Prevent double submission and use a request idempotency key for first creation. If authentication expires, preserve the draft and resume after sign-in.

Use inline errors and an error summary with focus on the first invalid field. A disabled “Próximo” with no explanation is insufficient. Show required-field hints once, rather than repeating both an asterisk and a visible “(obrigatório)” for every control. Step headings should describe all the fields they contain: the current “Categoria” step also asks location and five other classification questions.

If categories fail to load, show retry and allow draft save. If uploads fail, show the specific file and retry/remove options; optional media failures should not permanently block a text-only listing. Confirm media completion before claiming it is attached.

Publication returns the actual state and next action: published with a public URL; pending review with a private preview; changes requested with reasons and section links. Provide a review expectation only when the team can honor it.

Reduce onboarding to the information necessary to own a draft. Role, “how did you hear about us?” and discovery interests can be deferred. Personal residence is not project headquarters: suggest a profile location only with confirmation. Never infer that a Portugal-based maker's project must be based in Portugal or serve only Portugal.

## 9. Location and map design

### Data semantics

- **Team base**: where the people build; can have several locations or be distributed.
- **Public pin**: a place the builder is comfortable publishing; not automatically their home address.
- **Service area**: who can actually use the product, locally or globally.
- **Cabo Verde connection**: eligibility/provenance independent of physical location.

Country selection should include all supported ISO country codes, with Cabo Verde and common diaspora countries promoted in the list. Foreign city/locality must be supported. Cabo Verde keeps island and concelho selectors; street/zone is optional. The current zone regex validates a shape, not existence of a named place, so exact place data needs a real reference or lookup rather than a prefix-only assumption.

### Pin flow

Search for a place, select a result, or click/drag a pin. Confirm the place label and geographic coordinates. Offer **Aproximada** and **Local público exato**; default to city/concelho/island precision. Let builders skip the map or choose undisclosed. Do not require browser geolocation; if offered, make it user initiated and preview the result.

Store latitude/longitude as numeric coordinates, a precision value (`exact`, `locality`, `municipality`, `island`, `country`), placement source (`manual`, `geocoded`, `region_centroid`), and a stable place/reference ID when available. Coordinates must be paired and range checked; zero is a valid coordinate. Validate the selected region against the place, and flag mismatches rather than overwriting silently.

For approximate records, publish only the region centroid/geometry needed for display. Avoid retaining a private exact home pin when the user chose approximate location. A country-only record is a country-level aggregate, not a precise project marker in its capital.

### Public map

Default to **Cabo Verde**, with **Mundo / Diáspora** available. Remove hard geographic bounds in world mode. Show local regional clusters for approximate records, actual pins only for confirmed public locations, and a synchronized accessible results list. Label “Localização aproximada” where appropriate. Include remote/unlocated projects in a list and count even when they cannot be pinned.

Add country/island/category filters shared with discovery. A map-specific bounding-box/cluster API should return all matching geography and totals independently of vote rank. Use counts of distinct projects where a distributed project has several locations. List map records and regional aggregates without fetching full descriptions, galleries or every vote row.

Exact-pin selection is valuable, but it must not become a required step for a student, remote developer, or diaspora team.

## 10. Proposed data model

This is a design target, not a migration patch. Existing auth, comments, favorites, reports, upload records and moderation logs can be retained conceptually while the development database is regenerated.

| Entity | Suggested contents |
|---|---|
| projects | id; stable slug; owner_user_id; name; short_description; validated description; stage; availability; optional source_model/license; optional pricing_model/trial; product_kind; optional first_released_on; publication state; publication timestamps; visibility/moderation fields; version for concurrent edits; created/updated/deleted timestamps. Draft content may be incomplete. |
| project_links | id; project_id; kind; URL or validated contact destination; label; position; tracking policy; optional last checked/result. Preserve builder's canonical URL. |
| project_primary_links | project_id PK; link_id; composite FK ensuring the link belongs to that project. At most one primary link; publication validation decides when it is required. |
| categories | id; stable key; label/translation; explanation; position; active flag. |
| project_categories | project_id; category_id; composite PK. |
| project_primary_categories | project_id PK; category_id; composite FK to project_categories. Draft may omit; publication requires one. |
| topics / project_topics | Optional curated capability/format tags, separate from sector categories; can follow the first redesign. |
| project_members | project_id; user_id; role (owner/editor/maker); accepted/invited state; attribution visibility. One authoritative owner, accepted collaborators. No anonymous ownership claims. |
| project_locations | id; project_id; kind (team_base/public_place); country reference; locality; optional CV island/concelho/zone; coordinates; precision/source; display label; visibility; is_primary. Distributed projects can have multiple bases. |
| project_market_coverage | project_id; coverage kind (global/country/island); referenced country/island as applicable. Do not make “global” a fake country. |
| project_local_connections | project_id; connection key; optional short explanation. No ancestry documents or mandatory personal identity evidence. |
| project_platforms / project_languages / project_audiences | Deduplicated memberships to reference values; optional or conditionally required. Keep vocabulary definitions in one place. |
| project_media | project_id; kind; owned upload_id or validated provider reference; position; caption; alt_text; completion status. Use actual upload completion, not only a presigned URL being issued. |
| project_announcements | id; project_id; type (first_release/major_update); title; what's new; optional introduction; state; scheduled_for; published_at; review fields. One project may have several announcements. |
| announcement_upvotes | announcement_id; user_id; created_at; unique pair. Weekly rankings count announcement votes in their window. Existing project support/bookmark behavior can remain separate. |
| project_comments | Existing project thread; optional announcement association if needed. Avoid splitting community discussion unnecessarily. |
| project_metric_daily | project/day/event/link/surface aggregate counts with a defined uniqueness strategy. Keep analytics separate from project content. |
| submission_revisions / moderation_actions | Submitted version/snapshot and reviewer decisions. Useful if published content stays visible while material changes await review. |

Minimum relational rules:

- Categories and primary category belong to the same project; 1–3 categories at publication, no duplicate memberships.
- Primary destination belongs to the project; an unusable/removed link cannot remain the primary relation. Handle primary replacement atomically.
- Coordinates are both present or both absent, with latitude −90..90 and longitude −180..180; geography remains consistent with precision.
- Owner/member references are valid and owner transfers are explicit; permissions derive from membership, not a copied publisher name.
- Media references an owned upload of the correct type; validate logo ownership as well as gallery ownership. Current inspected services assert gallery ownership but do not show an equivalent logo check.
- Published project state has a publication timestamp; publication readiness is checked against the whole stored record in a transaction.
- Draft omissions remain null/empty collections, not invented defaults such as free, proprietary or Cabo Verde.
- Foreign countries come from a complete reference table, avoiding repeated schema migrations when a country is added.

Use separate shared schemas for **draft patch**, **publication validation**, **announcement submission**, and **public serialization**. Relaxing drafts without validating at publication would let incomplete projects become public. Return a structured error list with field paths and readable fixes.

Do not add all optional entities before they have a UI. The first implementation can cover projects, links, categories, one-or-more locations, local connection and basic members, with language/platform memberships; announcements can follow without confusing their semantics in the initial project design.

## 11. Publication, launch and editing rules

Directory publication: draft → pending review → published, or direct published for trusted builders when configured. Changes requested return an editable private submission; never force a new project record. Hide/withdraw actions are distinct from “discontinued”, since a discontinued tool can remain a useful historical listing.

When a builder selects “Já está disponível”, ask optionally when it first became available. Publish the directory page after readiness checks, but do not automatically announce “new product” or put it into a first-release ranking. Offer “Apresentar este projeto à comunidade” separately if an introductory announcement is useful; label it honestly.

First-release and major-update announcements get their own date/window, introduction and votes. Start with immediate announcements and weekly discovery; defer scheduling UI until needed, but reserve scheduled_for in the model. Use Atlantic/Cape_Verde for week boundaries and display the timezone explicitly. A delayed moderation decision must not silently consume a promised ranking window: confirm the effective window after approval or move to the next available one.

Edits to descriptions or links must not reset project publication, first-release dates, or launch ranking. Define which edits need review: changed destination/domain, substantially different purpose, and disputed maker attribution should require it. Prefer versioned pending changes while the last approved page stays public. Normal corrections/media adjustments can be immediate under the agreed policy.

Duplicate handling: compare normalized URLs and names and show possible matches. Let the builder edit their own existing listing, request ownership, or add an announcement to it. Do not deduplicate by domain alone: two products can share a company domain, marketplace, repository host or app-store host. Preserve meaningful paths/query values; ignore tracking parameters only for comparison. Same name is a hint, not proof.

## 12. Referral links and builder metrics

Current behavior: project detail invokes a `visit` event on the main website action. The browser deduplicates per project/type using sessionStorage; the server aggregates by project/type/source/day, skips recognizable bots and signed-in owners, and rate limits ingestion. This is a useful base, but it measures attempted click-through, not confirmed landing or sign-up.

Current gaps: GitHub clicks are not measured by the inspected sidebar; link/surface/campaign are absent; marking an event before the request succeeds can suppress a retry after failure; a client can bypass sessionStorage; rel=noreferrer means destination analytics cannot rely on the browser's referrer. None of these prove the counters are worthless, but they limit their interpretation.

Recommended next behavior:

1. Record clicks against a **link ID**, with placement (`detail`, `card`, `map`) and optional announcement ID. Keep “web/app” as client channel; it is not a referring campaign.
2. Use a redirect endpoint such as `/go/<link-id>` that resolves a stored, allowed destination and attempts to record the click without delaying successful navigation. Never accept an arbitrary user-supplied redirect target. Filter obvious bots/link prefetches; offer the direct destination if routing is unavailable.
3. Keep raw clicks and approximate deduplicated sessions as separate metrics. Use short-lived event/session keys and server-side duplicate handling if reporting session metrics. Do not label them unique people.
4. Optionally append `utm_source=hubdigital`, `utm_medium=referral`, and a project/announcement campaign to ordinary website destinations. Builder preview and opt-out are necessary: preserve existing parameters/fragments and signed URLs, and avoid modifying store/contact/deep links automatically.
5. Keep affiliate/partner links explicit and disclosed; referral attribution does not require an affiliate program.

Owner dashboard: project page views, outbound clicks by destination, support/upvotes, comments from others, saves if implemented, date range, trend and data-quality explanation. Analytics should be private to authorized owners/editors. Public pages do not need a full performance dashboard.

Only show click-through rate with matching definitions: page-session outbound clicks / page sessions for the same project, surface, window and deduplication method. Raw clicks from cards divided by deduplicated detail views can exceed 100% and is not a valid funnel rate. Purchases/signups require a separate opted-in integration; do not claim to observe them from a click.

Use aggregate-first analytics, avoid storing destination query strings containing personal tokens, and set short retention for any deduplication identifiers. Exact visitor locations and personal click histories are unnecessary for this feature.

## 13. Public display changes

**Discovery card:** name, short description, logo fallback, primary category plus at most two compact topics, meaningful availability/stage badge, optional broad location, and support/comment actions. Avoid showing every classification on the card.

**Project page:** primary action near the title and accessible on mobile; other destinations beneath it; gallery; about; categories; current availability/pricing/platforms/languages; “Ligação a Cabo Verde”; team attribution; help wanted; comments; related projects. Show only fields actually supplied. Optional business details belong lower down, not in a required metadata checklist.

**Dates:** “Publicado no HubDigital em …”, optional “Disponível desde …”, and separate announcements. Do not show a system timestamp as the original launch date.

**Map:** project card + approximate/exact label + click through to the same canonical project page. A Portugal location must appear in world/diaspora mode even if the product serves Cabo Verde.

**Preview:** reuse the real card and page components with draft data so the user sees the layout that will publish. The current review uses a separate card and repeats price/business-model badges; component reuse can reduce display drift and unnecessary repeated labels.

Add project-specific metadata/share images for WhatsApp and other social sharing, using the public title/description and approved image. Preserve canonical URLs and stable slugs. Audit current metadata behavior during implementation before treating it as completely absent.

## 14. Edge-case acceptance journeys

| Builder/project | Successful outcome |
|---|---|
| Android app without a website | Google Play is primary destination; Android selected; normal directory publication. |
| CLI/library on Codeberg | Repository/docs are valid links; no forced GitHub; developer-tools category; CLI/library platform. |
| Open-source public beta | Source model and availability both represented; repository/license optional details; no contradictory forced choice. |
| Paid stable proprietary product | live + available + proprietary + paid; primary action works without “beta”. |
| Project launched three years ago | Join directory now; historical release date optional; no fabricated launch today. |
| Student idea without URL/logo/pricing | Save immediately; publish an honestly labeled community idea; feedback action; no launch ranking. |
| Prototype with public demo | Demo primary destination; prototype availability; optional screenshots; no company/revenue prerequisite. |
| Private beta | Request-access/waitlist route and truthful button; cannot claim universally available. |
| Tourism payment/booking app | Tourism primary, finance/commerce secondary; appears in all selected category filters once per results list. |
| Nonprofit serving schools and government | Education primary; optional multiple audiences; no forced nonprofit/B2G exclusivity. |
| Cabo Verdean developer in Portugal | Explicit local connection; optional Lisbon pin; visible worldwide; no CV island requirement. |
| Team across Praia, Mindelo and Boston | Multiple bases or distributed; service area separately recorded; duplicate-free map totals. |
| Builder in a country outside the current enum | Real country/city stored; no meaningless “Other” geography. |
| Builder wants location privacy | Broad region or undisclosed; no home coordinates exposed; still discoverable in list. |
| Existing company with two tools on one domain | Similarity warning, separate product paths allowed; no domain-wide rejection. |
| Upload/network/category lookup fails | Inputs retained; draft still saveable; visible retry; optional image removable. |
| Create succeeds, publish fails | Retry publication of the saved ID; no second project. |
| Refresh or expired session halfway through | Draft recovery/resume, ownership preserved after sign-in. |
| Moderator requires corrections | Specific reasons, edit/resubmit same ID, accurate private/public visibility. |
| Removed primary link | Select replacement or move to a truthful no-destination state; no broken required action. |
| Discontinued product | Historical page remains labeled; stale destination removed or archived; no new launch claims. |
| 101+ projects, including low-vote local ones | Map coverage not truncated by top-100 ranking; complete filters/cluster totals. |
| Repeat clicks, bots, owner visits | Metrics apply documented filters/deduplication; raw clicks remain distinguishable from sessions. |

## 15. Implementation order and validation

### First: remove publication barriers and correct meaning

- Rebuild shared contracts/start dependencies reliably to resolve the reproduced month-filter mismatch.
- Introduce partial persistent drafts, retained creation ID and safe publication retries.
- Replace mixed access with stage/availability/source fields; make business/audience/pricing optional where appropriate.
- Add typed destinations and conditional primary link.
- Add 1–3 category memberships, primary category and synchronized filters/display.
- Correct publication versus first-release labels and pending-review success copy.
- Sanitize description content and apply media ownership/type/completion checks consistently.

### Second: represent local and diaspora projects accurately

- Local connection, all-country selection, locality, optional precision-controlled pins and service area.
- Cabo Verde/world map modes, regional aggregates, map query independent of ranking.
- Optional languages/help wanted, public section ordering and real-component preview.
- Per-link click metrics and optional tested referral attribution.

### Third: grow the launch/community loop

- Separate announcements and weekly voting windows, then scheduling if demand exists.
- Accepted maker collaboration, ownership claims/transfers, versioned reviewed edits.
- Related projects, follow/update notifications, share cards and optional built-with tags.

Defer formal reviews, public ratings, paid launch tiers, investor data, revenue/traction questions, complex price tables, and broad forums. They add maintenance and mandatory data burden without resolving the current submission problems.

For the redesign, test the acceptance journeys above across UI and API. High-value automated coverage includes draft save with only a name; publication failures with structured field paths; source/availability combinations; category membership/primary invariants; foreign location and coordinate checks; allowed destination schemes; sanitization; ownership; create/publish retry; moderation state copy; and map coverage beyond 100 projects. Manually verify mobile layout, keyboard controls, focus on errors, interrupted uploads and slow/offline recovery.

This audit did not run the repository's test suite or submit mutation requests: the only artifact added is this report. Implementation should regenerate schemas, seed data and shared outputs together, then run the relevant API and frontend checks.

## 16. Evidence map for implementation

| Area | Files |
|---|---|
| Shared fields and validation | [project-schema.ts](../packages/shared/src/project-schema.ts), [project-options.ts](../packages/shared/src/project-options.ts), [project-status.ts](../packages/shared/src/project-status.ts) |
| Location rules | [location-schema.ts](../packages/shared/src/location-schema.ts), [location-options.ts](../packages/shared/src/location-options.ts), [LocationFields](../web/src/modules/submit/ui/components/location-fields/location-fields.tsx) |
| Database | [projects.ts](../api/src/db/schemas/projects.ts), [schema.dbml](../api/src/db/schema.dbml), [category seed](../api/src/db/seeds/categories.ts) |
| Submission workflow | [SumbmitProvider](../web/src/modules/submit/context/sumbmit-form.tsx), [StepLayout](../web/src/modules/submit/ui/components/step-layout/step-layout.tsx), [create hook/schema](../web/src/modules/submit/hooks/use-create-project.ts) |
| Form and review | [ProjectForm](../web/src/modules/submit/ui/container/project-form/project-form.tsx), [ProjectCategories](../web/src/modules/submit/ui/container/project-categories/project-categories.tsx), [ProjectReview](../web/src/modules/submit/ui/container/project-review/project-review.tsx) |
| Persistence and review | [project services](../api/src/modules/projects/projects-services.ts), [route schemas](../api/src/modules/projects/projects-schemas.ts), [admin approval](../api/src/modules/admin/projects-services.ts) |
| Published UI and editing | [ProjectDetailView](../web/src/modules/project-detail/components/project-detail-view/project-detail-view.tsx), [EditProjectModal](../web/src/modules/releases/components/edit-project-modal/edit-project-modal.tsx), [publish hook](../web/src/modules/releases/hooks/use-project-actions.ts) |
| Map | [ProjectMapView](../web/src/modules/project-map/components/project-map-view.tsx), [CaboVerdeMap](../web/src/modules/project-map/components/cabo-verde-map.tsx), [island positioning](../web/src/modules/project-map/islands.ts) |
| Analytics | [trackProjectEvent](../web/src/modules/project-stats/utils/track-project-event.ts), [stats services](../api/src/modules/project-stats/project-stats-services.ts), [events schema](../api/src/db/schemas/project-events.ts) |
| Entry/onboarding | [dashboard gate](../web/src/routes/_authed/dashboard/route.tsx), [onboarding questions](../web/src/modules/onboarding/questions.ts), [requirePublisher](../api/src/hooks/require-publisher.ts) |
