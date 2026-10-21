# Submission implementation roadmap

Based on [the approved audit](./project-submission-audit.md). Deliver each step across the shared contract, database, API, owner UI and public display before starting the next. Development data can be rebuilt; no compatibility adapter is required.

| Order | Milestone | Done when |
|---|---|---|
| 1 | Reliable drafts and publication | A builder saves with only a name, resumes after refresh, edits the same record, and retries publication without creating duplicates. The server rejects incomplete publication. Review messages reflect the actual state. Shared builds stay current. |
| 2 | Honest project classification and destinations | Availability, source licensing and maturity are separate; optional business questions do not block publication; websites, app stores, repositories, demos and contact destinations have appropriate actions. Sanitize rich text and validate destination schemes and media ownership/completion. |
| 3 | Multiple categories | One primary and up to two secondary categories work in submission, editing, filtering, moderation and detail. Sector categories are separated from platforms/licensing. |
| 4 | Cabo Verde and diaspora geography | Local connection, full country selection, service area and optional approximate/exact public pins; worldwide map and complete map queries. |
| 5 | Project pages and outbound metrics | Shared preview/public components, useful optional languages/help-wanted/team fields, per-destination click metrics and optional referral attribution. |
| 6 | Announcements and collaboration | Existing-project directory publication is separate from first releases/major updates; weekly announcement windows, accepted makers and reviewed material edits. |

## First implementation

Milestone 1 is the first delivery. Keep the existing publication requirements until milestone 2 explicitly changes their meaning. Relax draft saving without relaxing public readiness, and retain drafts rather than resetting the database.

Validation: shared/API/web/admin builds; meaningful API integration tests for partial drafts, ownership, publication readiness, repeat creation keys and published edits; browser checks for save/resume/recovery and accurate review state.

## Status

Post-delivery builder evaluation: [submission feedback and improvement backlog](./submission-feedback.md). The first reported issue, saving blocking project creation, is fixed with separate saving/publication states, request deadlines and focused regression checks.

- Milestone 1: implemented and verified.
- Milestone 2: implemented and verified.
- Milestone 3: implemented and verified.
- Milestone 4: implemented and verified.
- Milestone 5: implemented and verified.
- Milestone 6: implemented and verified.

### Milestone 1 delivered

- Partial private drafts, including unfinished URLs and country selection. Unanswered classifications are stored as null rather than invented values.
- Save at every step, debounced autosave, account-scoped browser recovery and dashboard resume.
- Retained project ID plus an account-scoped creation key so retrying creation/publication does not create another project.
- Server-side readiness checks with field paths at publication, and protection against incomplete edits to published/pending projects.
- Accurate pending-review success messages and rebuilt shared contracts before root development commands.
- Applied migration `0019_fantastic_mister_fear` to the development database without resetting existing data; regenerated DBML.

Verification: 166 API tests passed; shared, API, web and admin production builds passed; changed submission files passed ESLint. Browser checks confirmed name-only autosave, refresh recovery, dashboard resume, publication blockers and a 390 px mobile layout without horizontal overflow. The temporary private browser-test draft was removed. The shared preview disconnected after those checks, so final browser-state cleanup could not be verified.

### Milestone 2 delivered

- Independent project maturity, availability and source model, with optional license, pricing, customer model, platforms and multiple audiences. An unanswered business question no longer blocks publication.
- Normalized destinations with one primary action and up to eight links: website, app store, repository, demo, documentation, pricing, community, crowdfunding, email, WhatsApp and other links. A website is optional; ideas can collect feedback without an external destination. Available projects need a valid primary destination.
- Shared destination validation and context-aware actions in submission preview, public pages, owner editing and moderation. Public details omit unanswered classifications and label the HubDigital publication date explicitly.
- Sanitized rich text on API writes and reads; safe HTTP(S), email and WhatsApp destinations; media ownership checks for drafts and completed-upload checks for publication. Upload completion verifies stored size, content type and image signature before accepting PNG/JPEG/WebP files up to 5 MB.
- Applied migration `0020_chief_richard_fisk` to the development database; regenerated DBML and updated development seeds to the new fields and owned media records.

Verification: 182 API tests passed; shared, API, web and admin production builds passed; changed submission files passed ESLint and TypeScript checks. Browser checks confirmed publication with an app-store-only destination and no optional business fields, the matching install action on the public page, restored values and successful updates in owner editing, and a 390 px public layout without horizontal overflow. Upload completion tests mock object storage; a live R2 upload has not been verified in this milestone.

The temporary browser-test project was removed after verification; no recovery entry for it remains.

### Milestone 3 delivered

- One required primary category and up to two distinct optional secondary categories. The primary remains `projects.category_id`; ordered secondary memberships use `project_secondary_categories` with restrictive category foreign keys, a composite primary key and a two-position limit. Deferred database constraints prevent secondary memberships without a distinct primary while allowing atomic primary swaps.
- Shared request/response contracts, transactional draft and published edits, publication validation, owner recovery, preview, public details, maker profiles, favorites and moderation all carry the new memberships. Discovery cards retain the primary category; public detail and moderation show every selected category.
- Public and admin category filters match any membership without multiplying results. Admin category reference counts include primary and secondary memberships, including retained deleted projects.
- Searchable category selection with an explicit primary marker, “Tornar principal”, removal/promotion and a three-category counter. Search ignores accents. Category loading failures still allow saving a draft.
- Updated sector labels and added housing, culture/languages, games/sport and ocean economy. SaaS and open source were removed from the sector taxonomy; source licensing and platforms remain separate fields. Existing development rows using the removed categories were moved to Outro; open-source category data preserves a source-model answer when none existed.
- Applied migration `0021_faithful_spencer_smythe` to the development database and regenerated DBML. No runtime compatibility adapter was added.

Verification: all 186 API tests verified (one new fixture corrected and its 62-test project suite rerun); shared, API, web and admin production builds passed; changed submission ESLint passed. Browser confirmed search without accents, selection limits, primary swaps, removal/promotion, draft restoration, preview, publication with all three categories, public display, successful published edits and a 390 px layout without horizontal overflow. The preview disconnected during final cleanup; removal of the temporary project was verified directly in the development database. Browser recovery cleanup could not be verified after disconnection.

Milestone 4 delivery: [Cabo Verde and diaspora geography](./geography-implementation.md). Milestone 5 delivery: [project information and destination metrics](./project-pages-and-metrics.md). Milestone 6 delivery: [announcements, creators and reviewed edits](./community-and-reviewed-edits.md).

### Screenshot-inspired submission refinement

See [the Product Hunt screenshot follow-up](./submission-product-hunt-inspiration.md), based on ten user-provided images retained under `specs/references/product-hunt-submission/`. It records concise field copy, a compact/full category browser, card preview beside logo selection, gallery cover/order, and later video, attribution, trial and offer requirements.

Preserve the user's current layout decisions: single labels for Monetização and Modelo de negócio; Código-fonte with Acesso/Licença side by side on desktop; only one divider after the audience controls. Existing draft, publication and destination rules remain in force.

The user subsequently accepted the finer categories and browsing groups; see [category taxonomy](./category-taxonomy.md). This delivery applies migration `0022_granular_categories`, adds 39 specific choices in seven navigation groups and extends category search with synonyms. The focused UI pass is now implemented alongside milestones 4–6. Promo codes/offers, trials, extra video providers and email invitations remain deferred. No feature outside the approved roadmap was added.

### Milestones 4–6 delivered together

- Worldwide geography: 249 countries/territories, local and diaspora connections, service area, additional team bases and optional public pins. Approximate coordinates are rounded before persistence. The complete map feed supports country/island/category filters and regional aggregation.
- Clearer submission and public pages: compact searchable categories plus a grouped full browser; concise Portuguese labels, matching project-card preview, optional languages/team/help information and gallery cover metadata. The agreed monetization/business/source-code layout is preserved.
- Destination analytics: private per-link totals for 7/30/90 days and explicit optional referral attribution. Public links remain usable when recording fails; no individual visitor histories are stored.
- Separate community announcements with independent votes, current Cabo Verde weekly windows and staff review. Accepted creator invitations add public credit without giving project ownership or metric access.
- Reviewed material edits preserve the approved page and destinations until approval. Immutable proposals, row versions and atomic audit decisions prevent replacement/stale approvals; owners can resume proposals and read private rejection feedback.
- Applied migrations `0023_worldwide_geography`, `0024_project_profiles_and_clicks`, `0025_community_and_revisions` and `0026_project_revision_versions`; updated DBML. Existing development data was retained.

Validation record: a clean full API run passed 207 tests across 19 files. Two additional transition checks and the affected project/community suites passed (77 checks); the final 11-test community rerun also passed with hidden-owner invitation coverage. This verifies 209 tests overall. Desktop and 390 px browser flows verified publication/recovery/editing, rounded pins, secondary-base filtering, categories, referral clicks and private metrics, announcement approval, reviewed-page replacement and creator acceptance. [Screenshots](./references/submission-implementation/README.md) retain the local test UI.

Cleanup: the development review setting was verified restored. The three isolated browser-test accounts, their projects and cascading community/analytics records, and their test audit entries were removed. Temporary role/cleanup scripts and browser credential files were removed. Other development accounts, projects and drafts were retained.

Boundaries: pins are manual and locality text is builder supplied; there is no address lookup or polygon validation. Live R2 uploads were not reverified (existing storage tests mock R2). Promo codes/offers, trials, additional video providers, invitation emails, scheduling and contributor editing remain deferred. No deployment was performed.

Final checks: shared, API, web (browser + server) and admin production builds passed. Changed UI files passed ESLint; `git diff --check` passed. The final 11-test community suite passed, including hidden-owner invitation visibility and acceptance. The running map API returned HTTP 200 during the final checks.

Post-delivery simplification: [SUB-02](./submission-feedback.md) replaces the expanded team/service/profile questionnaire with a single project base and a four-step builder flow. Categories remain unchanged. This supersedes the earlier submission UI requirements for multiple bases, service area and languages/help/team prose; accepted creator collaboration stays separate.
