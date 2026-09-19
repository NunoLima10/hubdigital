# HubDigital Cabo Verde — MVP.md

This supersedes [`mvp-roadmap.md`](./mvp-roadmap.md) (kept for history). It reflects the
gap analysis of `feat/project-upvotes-and-detail` plus the product decisions made on
2026-08-29. Nothing below is coded yet — this is the plan to approve before implementation
starts.

## Progress

| Feature | Status |
|---|---|
| F1 — Image uploads (R2, ported from Placar) | **Done** |
| F2 — Weekly launch cycle and ranking | **Done** |
| F3 — Draft → publish, soft delete | **Done** |
| F4 — Vote integrity + logged-out upvote | **Done** |
| F5 — Comments | **Done** |
| F6 — Public maker profiles | **Done** |
| F7 — Search, filters, island of origin | **Done** |

All seven features are implemented. `pnpm api:build`, `pnpm web:build` and `pnpm shared:build`
pass; **80 API tests** pass across 6 files (`pnpm --filter @hubdigital/api test`). Every feature
was exercised in a browser against a live API and a database migrated from scratch: drafts stay
private, publishing enters the weekly ranking, a logged-out upvote prompts sign-in and then
casts, comments thread with replies and counts, maker profiles resolve by handle, and filters
sync to shareable URLs.

Migrations added: `0006` (file_uploads), `0007` (status/published_at/launched_at/deleted_at,
backfilled so existing rows stay public), `0008` (upvote ip/user-agent audit columns),
`0009` (comments), `0010` (publisher handle + social links, backfilled from display names),
`0011` (project island).

Two things deliberately left as they were, both worth a follow-up:

- `ADMIN_ROLES` in `api/src/lib/plugins/admin.ts` is `["admin", "user"]`. That is Better Auth's
  `adminRoles` config, so the admin plugin currently treats every user as an admin. Comment
  moderation checks `role === "admin"` directly to avoid inheriting the problem, but the config
  itself should be narrowed.
- Island is nullable on `projects`: required for new submissions, empty for rows created before
  the field existed, rather than stamping them with a guessed island.

## Baseline (verified in the current branch)

- Better Auth email/password, sessions, admin roles.
- Onboarding → publisher profile, enforced before dashboard/submit access.
- `POST/PATCH /v1/projects`, `GET /v1/projects`, `GET /v1/projects/:slug`, `GET /v1/projects/mine`.
- Upvote toggle with a unique `(project_id, user_id)` index and `hasUpvoted` in every response.
- Seeded categories, submit stepper posting real data, landing list + detail modal + `/projects/$slug`.
- Shared Zod contract package (`@hubdigital/shared`) used by both API and web.

## Decisions from this round

| Topic | Decision |
|---|---|
| Image uploads | Port the presigned-URL pattern from `D:\work\placar\api` (Cloudflare R2), not build from scratch. |
| Launch cadence | **Weekly**, not daily — Cabo Verde's volume won't sustain a daily reset. |
| Moderation | No review queue for v1. A project goes `draft → published` directly by its owner. The `status` column ships now so a `pending`/reject step can be added later without a migration. |
| Vote integrity | Build now. |
| Comments | Build a small custom implementation inspired by [Fuma Comment](https://github.com/fuma-nama/fuma-comment)'s data model (page key, thread/parent, roles) rather than importing the package — Fuma Comment is coupled to Next.js route handlers and doesn't attach to a Fastify server. |
| Maker profiles | Build now. |
| Transactional email | **Deferred.** Design the DB/event hooks so it slots in later, but don't send anything yet. |
| Search & filters | Build now — includes category, and island/city (not a separate category-page feature). |
| Island of origin | Build now, exposed as a filter alongside search. |
| Map of islands | Flagged as valuable, **not in this build** — needs a geo library decision (Stage 3+, see Parked). |
| Category-specific pages | **Dropped.** A filter chip replaces the dedicated `/categorias/:key` route from the earlier draft. |
| Link previews / OG tags | Deferred to the phase right after this one, not in the current batch. |
| Maker stats (views/visits/upvotes) | Build now, surfaced in a new "project performance" section of the dashboard. |
| Weekly digest email | Deferred, bundled with transactional email. |
| CI/CD | Deferred. |

---

## Stage 1 — Ship the loop that makes this look like a product

### F1. Image uploads (logo + banner) — ported from Placar

**Why:** `logo_url` / `banner_image_url` already exist on `projects` and in every API response,
but [`projectBodySchema`](../packages/shared/src/project-schema.ts) never accepts them, and
[`ImageSelector`](../web/src/components/image-selector/image-selector.tsx) holds the file in
local `useState` and uploads nothing. Every card renders logo-less today.

**Reference implementation:** `D:\work\placar\api\src\plugins\internal\uploader.ts`,
`db\schemas\uploads.ts`, `modules\uploads\uploads-services.ts`, and
`D:\work\placar\apps\dashboard\src\hooks\use-upload.ts`. Same shape, adapted to this repo's
paths and error/response helpers.

**DB**
- New table `file_uploads`: `id serial`, `key text unique`, `user_id → users`, `type` (pgEnum,
  values `project_logo | project_banner`), `content_type varchar(20)`, timestamps.
- On `projects`: keep `logo_url` / `banner_image_url` as columns, but store the **R2 object key**
  in them (not a full URL) — resolved to a public URL at read time, same as Placar's
  `getUploaderPublicUrl`. Avoids stale URLs if the bucket domain ever changes.

**API**
- Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to `api`.
- New `uploaderPlugin` (fastify-plugin) registered in `buildServer`, decorating
  `reply.getUploaderPublicUrl(key)`.
- `POST /v1/uploads` behind `authenticate` — body `{ name, contentType, type }`, validates
  `contentType` against an image allowlist (png/jpeg/webp/gif/svg), returns
  `{ uploadUrl, fileKey }`. Persists a `file_uploads` row for auditing (matches Placar 1:1).
- Extend `projectBodySchema` with `logoUrl` and `bannerImageUrl` as optional **keys** returned
  by that endpoint (not arbitrary URLs — closes the open question from the old roadmap about
  "accept external image URLs").
- Map `logoUrl`/`bannerImageUrl` through `getUploaderPublicUrl` wherever a project is serialized
  (`listProjects`, `getProjectBySlug`, `listMyProjects`).
- New env vars (see `.env.local` section below).

**Web**
- Port `useUpload()` verbatim in spirit: `POST /uploads` for the presigned URL, then
  `axios.put` straight to R2 with upload-progress state.
- Wire it into `ImageSelector` and `use-submit-form` — selecting a file uploads immediately (or
  on step-advance) and stores the returned `fileKey` in form state.
- `project-review` shows the real preview; `Projectcard` and the detail view render the resolved
  logo/banner URL the API now returns.
- Add `uploads: "/uploads"` to `web/src/api/endpoints.ts` (currently only holds `auth`).

**`.env.local` additions (API)**
```
CLOUDFLARE_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
CLOUDFLARE_BUCKET=dev-hubdigital
CLOUDFLARE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_ACCESS_KEY_SECRET=...
UPLOADER_URL_EXPIRES_IN=300
```
(Fixing Placar's `ACESS` → `ACCESS` typo here since this is a fresh implementation.)

**Done when:** a maker uploads a logo in the stepper and sees it on the homepage card, the
detail page, and the releases dashboard.

---

### F2. Weekly launch cycle and ranking

**Why:** `listProjects` only does `orderBy desc(createdAt)`. There's no unit of competition and
no reason to come back next week. Given expected volume, **weekly** is the right cadence —
daily would mostly show near-empty days.

**DB**
- `launched_at timestamptz` on `projects`, set when a project is published (see F3). Index on
  `(launched_at desc, id)`.
- `status` enum `draft | published` (room to extend later — see F3).

**API**
- List querystring gains `period=this_week | last_week | all` (ISO week, `Atlantic/Cape_Verde`
  / UTC-1) and `sort=upvotes | newest`.
- `GET /v1/projects/leaderboard?week=YYYY-Www` for the weekly ranking, ordered by upvotes within
  the window, `created_at` as tie-break.
- Public list/detail only ever return `status = published`.

**Web**
- Homepage groups into **"Esta semana"** (the current leaderboard, primary focus) and
  "Semanas anteriores" underneath, rank number shown, top 3 marked.
- `/rankings/$week` archive route so a past week stays linkable.

**Done when:** the homepage's main view is this week's ranked launches, and last week's
ranking is frozen and linkable.

---

### F3. Draft → publish, no review gate (yet)

**Why:** the roadmap originally proposed a moderation queue; for now the decision is to let an
onboarded user publish directly, but ship the `status` column so a `pending` step is a data
migration away, not a rewrite, when it's needed.

**DB**
- `status` enum `draft | published` on `projects` (see F2), default `draft`.
- `published_at timestamptz`, `deleted_at timestamptz` (soft delete).

**API**
- `POST /v1/projects` creates as `draft`.
- `POST /v1/projects/:id/publish` — owner-only, sets `status = published`, `published_at = now()`,
  `launched_at = now()` if unset.
- `DELETE /v1/projects/:id` — owner-only soft delete (there is currently no delete endpoint at
  all).
- Public list/detail filter to `published`; `GET /v1/projects/mine` returns both so the
  dashboard can show drafts.

**Web**
- Releases dashboard shows a draft/published badge and a "Publicar" action.
- Submit stepper's final step becomes "Guardar rascunho" vs. "Publicar" instead of a single
  submit.

**Done when:** a new project stays private until its owner explicitly publishes it, and can be
deleted.

---

### F4. Vote integrity + logged-out upvote

**Why:** the unique index already stops double-voting, but the upvote route has no per-route
rate limit, and a logged-out click just 401s instead of prompting sign-in — the highest-intent
moment on the page, wasted.

**DB:** add `ip_address`, `user_agent` to `project_upvotes` for after-the-fact auditing.

**API:** per-route rate limit on `POST /v1/projects/:id/upvote`, keyed by user id; keep
returning the fresh count for optimistic-update reconciliation.

**Web:** a logged-out click opens the sign-in modal and replays the vote on return; roll back
the optimistic count in `use-toggle-upvote` on failure.

**Done when:** a logged-out visitor can click upvote, sign in, and land back with the vote
registered.

---

## Stage 2 — Community loop

### F5. Comments (custom, Fuma-inspired)

**DB:** `comments` — `project_id`, `user_id`, `parent_id` (single reply depth), `body`,
timestamps, `deleted_at`. Index on `(project_id, created_at)`.

**API:** `GET /v1/projects/:slug/comments`, authenticated `POST`, owner-scoped
`PATCH`/`DELETE`, admin delete. Expose `commentCount` on `projectMinimalSchema`.

**Web:** thread on the detail route, composer, empty state, relative timestamps; comment count
next to the vote count on cards.

**Done when:** a signed-in user posts a comment, sees it without a reload, and the count shows
on the homepage.

### F6. Public maker profiles

**DB:** on `publishers` — unique `handle`, `website_url`, `github_url`, `linkedin_url`.

**API:** `GET /v1/makers/:handle` (bio, links, published projects, total upvotes received),
`PATCH /v1/makers/me`; include `handle` in the existing author payload.

**Web:** `/makers/$handle` route; author name on cards/detail becomes a link; profile editing
in the dashboard.

**Done when:** clicking an author anywhere opens their profile listing everything they've
launched.

---

## Stage 3 — Discovery

### F7. Search, filters, island & city

**Why:** the list endpoint only takes `limit`/`offset`. Six enums already exist on every
project (pricing, platform, business model, access, stage, audience) plus the new island field
below, and none are filterable.

**DB**
- `tsvector` over `name` + `short_description`, GIN index (plain `ILIKE` is fine at launch
  volume if the index is deferred).
- Location on `projects`, defined in `@hubdigital/shared` (`location-schema.ts`): a `country`
  (`cv`, then the diaspora countries `pt`, `us`, `fr`, `nl`, `lu`, `it`, `br`, `es`, `other`). For `cv`, `island` is required (the nine inhabited islands,
  as cv-location codes `CV1`–`CV9`) and `municipality` and `zone` are optional refinements,
  stored as codes from the same dataset (a zone requires its municipality). Abroad countries carry nothing
  below the country. Column layout is decided when the DB work happens.

**API:** add `q`, `categoryId`, `island`, `pricing`, `projectStage`, `platform`, `sort` to the
list querystring. Response shape unchanged.

**Web:** search field in the header, filter chips (category + island together, not separate
pages), state synced to URL search params via TanStack Router so a filtered view is shareable.
Island select added to the submit stepper.

**Done when:** a visitor can filter to, say, every project built on São Vicente, and the URL
for that view is shareable.

**Parked from this feature, not built now:** a real map of the islands with projects plotted
on it. Worth doing once there's enough island-tagged data to make it interesting — needs a
mapping-library decision (e.g. an SVG Cabo Verde map + plotted markers, no need for a full
tile-based map given the fixed, small geography).

---

## Parked for a later batch (explicitly deferred this round)

- **Transactional email** (approval/comment notifications, verification) — design hooks now,
  send nothing yet.
- **Weekly digest email** — depends on email infra above.
- **Link previews / OG tags / sitemap** — next phase after this batch, not in it.
- **CI/CD, error tracking** — later.
- **Maker/project stats dashboard** (views, visits, upvote history over time) — valued, slot
  into the same batch as F6 once F2's `project_events` groundwork exists; tracked here so it
  isn't forgotten, call it **F8** when scheduled:
  - `project_events`: `project_id`, `type` (`view`|`visit`), `day`, `count`, unique on
    `(project_id, type, day)`.
  - `POST /v1/projects/:id/events` fire-and-forget; owner-only `GET /v1/projects/:id/stats`.
  - New "Desempenho" section on the dashboard/maker profile showing views, visits, upvotes and
    publish status per project.

## Deliberately out of scope for HubDigital's MVP

Sponsored placements, follower graph, collections, reviews/ratings, job board, a standalone
forum, streaks/badges, a public API, multi-maker credits, in-app notification centre, payments.

---

## Build order

1. F1 images (unblocks everything visual).
2. F3 draft/publish + F2 weekly ranking (the core loop).
3. F4 vote integrity.
4. F7 search/filters/island (discovery).
5. F5 comments, F6 maker profiles (community).
6. Parked items when prioritized: stats dashboard, email, digest, OG/sitemap, CI, map.

Each item lands as DB → API → web, matching how the branch is already structured.
