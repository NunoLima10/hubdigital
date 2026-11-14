# HubDigital Cabo Verde — ADMIN.md

Plan for a third workspace, `admin`: a staff-only back-office for reviewing submissions and
moderating the community. Companion to [`MVP.md`](./MVP.md), which shipped the public product
and explicitly deferred the review queue ("No review queue for v1 … the `status` column ships
now so a `pending`/reject step can be added later without a migration"). This is that step,
plus the moderation tooling around it.

**Nothing below is coded yet.** This is the document to approve before implementation starts.

---

## 0. Blocking prerequisite — privilege escalation in the current auth config

Before any admin surface exists, this has to be fixed. It is not a style issue.

```ts
// api/src/lib/plugins/admin.ts
export const adminRoles = ["admin", "user"] as const;
export const ADMIN_ROLES: string[] = [...adminRoles];
```

`ADMIN_ROLES` is passed to Better Auth's admin plugin as `adminRoles`, the list of roles the
plugin treats as staff. It contains `"user"`, and `defaultRole` is `"user"`. **Every signed-in
account is therefore an admin as far as the plugin is concerned**, and the plugin's routes are
already mounted publicly through the catch-all handler in
[`plugins/better-auth.ts`](../api/src/plugins/better-auth.ts) at `/v1/auth/*`. Any account can
today call `POST /v1/auth/admin/set-role` and promote itself, or `admin/ban-user` to ban
someone else.

`MVP.md` noted this as a follow-up; the comment moderation path dodged it by checking
`role === "admin"` directly ([`comments-controllers.ts:90`](../api/src/modules/comments/comments-controllers.ts)).
Nothing else does.

**Fix (ships first, independently of the admin app):**
- `adminRoles = ["admin"] as const`, with a separate `userRoleValues` union that keeps `"user"`
  for typing `req.user.role`.
- Add an e2e test asserting a plain `user` session gets `403` from `/v1/auth/admin/list-users`
  and from `/v1/auth/admin/set-role`.
- Seed the first admin (see A1) instead of relying on a manual DB edit.

---

## Baseline (verified in the repo, 2026-08-30)

What already exists and is worth reusing rather than rebuilding:

| Asset | Where | Note |
|---|---|---|
| Better Auth admin plugin | `api/src/lib/auth.ts` | Gives `list-users`, `set-role`, `ban-user`, `unban-user`, `remove-user`, `impersonate-user`, `revoke-user-sessions` for free once `adminRoles` is fixed. |
| Hard-ban columns | `users.banned`, `ban_reason`, `ban_expires` | Better Auth's own; already migrated. |
| Impersonation column | `sessions.impersonated_by` | Already migrated; unused. |
| `hasRole(role)` hook | `api/src/hooks/has-role.ts` | Written, **never registered on any route**. Needs widening to accept several roles. |
| `projects.status` enum | `draft \| published` | Extend, don't replace. |
| Soft deletes | `projects.deleted_at`, `comments.deleted_at` | Comment tombstone logic already handles orphaned replies. |
| Vote audit columns | `project_upvotes.ip_address`, `user_agent` | Populated, never read. Feeds A9. |
| `ADMIN_SEED_*` env vars | `api/src/config/index.ts`, `.env.example` | Declared and validated, **but no seed uses them**. |
| Web base setup | `web/` | Vite 6 + React 19 + Mantine 8 + TanStack Router/Query + axios + Better Auth client. This is what `admin/` copies. |

---

## Decisions

| Topic | Decision |
|---|---|
| Separate app or a route inside `web`? | **Separate `admin/` workspace.** A staff bundle should not ship to every visitor, and a separate origin lets CORS/cookies/rate limits be tightened independently. |
| Base setup | Copied from `web/`, not scaffolded fresh — same Vite/Mantine/TanStack/theme so the two stay visually and structurally consistent. |
| API surface | New `/v1/admin/*` module in the existing Fastify app, not a second server. Shares db, auth, error handler, swagger. Settings and reports get their own modules (`modules/settings`, `modules/reports`) because each also has a public endpoint; the admin module imports their services. |
| Review gate | **Global on/off toggle**, stored in the database (not an env var) so it can be flipped from the admin UI without a redeploy. |
| Ban model | Two distinct things: **hard ban** (Better Auth's `banned` — cannot sign in) and **shadow ban** (signs in normally; the content is hidden from the public, and the owner is told, with the reason). |
| Comment moderation | **Hide** (reversible, staff-only, keeps the row) is separate from **delete** (the existing tombstone). Hiding is the default staff action. |
| Audit | Every staff mutation writes a `moderation_actions` row. Non-negotiable — moderation without an audit trail is unaccountable. |
| Roles | **One staff role, `admin`.** `user` stays the public default. Decided on approval, 2026-08-30: a second `moderator` tier isn't worth the code while the team is one person, and it can be added later without a migration (`users.role` is already free text). |
| Email notifications | Still deferred, per `MVP.md`. Rejection reasons are stored and shown in the maker's dashboard, not emailed — yet. |
| Admin sign-up | **No self-registration.** The admin app has a sign-in form only; accounts are promoted from the users page or seeded. |

---

## A0. The `admin` workspace

Third pnpm workspace, mirroring `web/`'s structure so anyone who knows one knows the other.

**Workspace wiring**
- `pnpm-workspace.yaml`: add `- 'admin'`.
- Root `package.json`: `admin:dev`, `admin:build`, `admin:preview` filtered on `@hubdigital/admin`.
- `.claude/launch.json`: an `admin` configuration on **port 5174** (web keeps 5173, api 3000).

**Copied verbatim from `web/` (adjusted paths only)**

```
admin/index.html                 admin/vite.config.ts        admin/postcss.config.cjs
admin/eslint.config.js           admin/tsconfig*.json        admin/public/_redirects
admin/src/main.tsx               admin/src/app/index.tsx     admin/src/app/provider.tsx
admin/src/app/router.tsx         admin/src/app/query-client.tsx
admin/src/app/env.ts             admin/src/app/theme.ts      admin/src/app/error.tsx
admin/src/api/api.ts             admin/src/api/endpoints.ts
admin/src/lib/auth-client.ts     admin/src/lib/zod-error-map.ts
admin/src/layouts/page.tsx       admin/src/components/toggle-sheme-button/
```

`theme.ts` is copied as-is (same brand palette, same `spacing` scale). The only visual
divergence is a permanent "ADMIN" badge in the header so a screenshot is never mistaken for the
public site.

**Deliberately not copied:** onboarding, submit stepper, project-list, comments composer,
image-selector, tiptap. The admin app renders a read-only description; it does not need an
editor in phase 1.

**Dependencies** — same versions as `web`, minus the tiptap / `@mantine/tiptap` / `react-rewards`
set. Nothing added: no table library (Mantine's own `Table` is enough at this volume) and no date
picker — the queue and audit filters use preset ranges ("últimos 7 dias", "30 dias", "desde
sempre"), which is the better control for a log anyway.

**`admin/src/lib/auth-client.ts`** adds the admin client plugin so the Better Auth user-admin
endpoints are typed:

```ts
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: env.API_URL + endpoints.auth,
  plugins: [adminClient()],
});
```

Only the **role values** move to `packages/shared` (A1); the `createAccessControl` statement stays
in `api/src/lib/plugins/admin.ts`. Passing `ac`/`roles` to `adminClient` only buys client-side
permission checks, which are worth nothing with a single role and server-side enforcement on every
route — and it would drag `better-auth` into a package that otherwise needs only Zod.

**Route tree**

```
admin/src/routes/
  __root.tsx
  login.tsx                    # sign-in only, no sign-up link
  _staff.tsx                   # guard: session exists AND role === "admin"
  _staff/index.tsx             # overview (A10)
  _staff/queue.tsx             # review queue (A3)
  _staff/projects.index.tsx    # all projects (A3/A4)
  _staff/projects.$id.tsx      # one project: full record, actions, its comments
  _staff/comments.tsx          # comment moderation (A5)
  _staff/reports.tsx           # user reports inbox (A7)
  _staff/users.index.tsx       # user management (A8)
  _staff/users.$id.tsx         # one user: projects, comments, votes, sanctions
  _staff/categories.tsx        # categories CRUD (A11)
  _staff/audit.tsx             # audit log (A6)
  _staff/settings.tsx          # platform settings (A2)
```

The `.index.tsx` on the two list pages is load-bearing, not a style choice: a plain
`projects.tsx` alongside `projects.$id.tsx` makes the list a **parent layout** of the detail
route, and without an `<Outlet/>` the detail page silently never renders. As siblings they behave
as two ordinary routes.

`_staff.tsx` is `web`'s `_authed.tsx` plus the role check — and it is a **convenience, not a
control**. Every `/v1/admin/*` route enforces the role server-side; the client guard only avoids
rendering a shell the API would reject.

**Env** (`admin/.env.local`, same `VITE_APP_` prefix convention as web):

```
VITE_APP_API_URL=http://localhost:3000/v1
VITE_APP_ASSETS_URL=https://pub-xxxxxxxx.r2.dev
```

**API config**: add `http://localhost:5174` to `ALLOWED_ORIGINS` in `.env.example` — it feeds
both the CORS plugin and Better Auth's `trustedOrigins`.

**Done when:** `pnpm admin:dev` serves a sign-in page on 5174, a `user` account is bounced with
"Você não possui permissão", and an `admin` account lands on an empty overview.

---

## A1. Roles and staff access

**Shared** (`packages/shared/src/roles.ts`, new)

```ts
export const userRoleValues = ["user", "admin"] as const;
export const staffRoleValues = ["admin"] as const;
```

plus the `createAccessControl` statement and the two role definitions, moved out of the API so
the admin app's `adminClient` plugin builds from the same source.

`staffRoleValues` is kept as its own array even though it currently holds one value: it is what
the guard and `ADMIN_ROLES` read, so introducing a `moderator` tier later is a one-line change
rather than a hunt through call sites.

**API**
- `ADMIN_ROLES = [...staffRoleValues]` — the fix from §0. One role, `admin`.
- Replace `hasRole(role)` with `hasAnyRole(...roles)` and export `requireAdmin = hasAnyRole("admin")`.
  Keep throwing the existing `ForbiddenError` so the error envelope is unchanged.
- Register `requireAdmin` as an `onRequest` hook for the whole `/v1/admin` prefix rather than per
  route — one place to get wrong instead of thirty.
- New seed `api/src/db/seeds/users/admin.ts` using the already-declared `ADMIN_SEED_*` config,
  wired into `RundSeeding` and run in **every** environment (not just dev) when the three vars
  are present. Idempotent: skip if the email already exists.

**Done when:** a `user` session gets 403 from every `/v1/admin/*` route and from Better Auth's
`admin/*` routes, and `pnpm api:db:seed` creates the first admin from env.

---

## A2. Platform settings and the review toggle

The review gate has to be flippable at runtime by a non-deployer, so it lives in the database.

**DB** — new table `app_settings`:

| column | type | note |
|---|---|---|
| `key` | `varchar` PK | e.g. `moderation.review_required` |
| `value` | `jsonb` | typed per key by a Zod map, not free-form |
| `updated_by` | `text → users.id` | nullable |
| `updated_at` | `timestamptz` | |

A key/value table beats a one-row settings table here: adding a flag is an insert, not a
migration, and the same table carries the other toggles below.

Keys defined in phase 1 — Zod-validated, with defaults used when the row is absent, so an empty
table behaves exactly like today:

| key | type | default | effect |
|---|---|---|---|
| `moderation.review_required` | boolean | `false` | **The main toggle.** `true` routes publishes into `pending`. |
| `moderation.auto_approve_trusted` | boolean | `true` | Publishers marked trusted skip the queue even when review is on. |
| `submissions.open` | boolean | `true` | `false` makes `POST /v1/projects` answer 503 with a maintenance message. |
| `announcement.text` | string \| null | `null` | Renders in the public `Page` layout's existing `banner` slot. |

**API**
- `SettingsService` with a **process-level cache** — settings are read on nearly every publish
  and change a few times a year. Invalidated on write; 60s TTL as a backstop so a second API
  instance converges without a restart.
- `GET /v1/admin/settings`, `PATCH /v1/admin/settings` (admin only, writes an audit row).
- `GET /v1/settings/public` — unauthenticated, returns only `announcement.text` and
  `submissions.open`, so `web` can render the banner and disable the submit CTA.

**Web (`admin`)** — `_staff/settings.tsx`: a switch per boolean plus a textarea for the
announcement, with an explicit "isto afeta todos os projetos" warning on the review toggle and a
live count of what turning it on would queue.

**Done when:** flipping `moderation.review_required` in the admin UI changes the behaviour of the
next publish on the public site, with no redeploy and no restart.

---

## A3. Project review queue

**DB** (migration `0012`)
- Extend the `project_status` pgEnum with `pending` and `rejected` (`ALTER TYPE … ADD VALUE`;
  Postgres will not let a value added in a transaction be used in that same transaction — so the
  enum extension goes in its own migration file, ahead of anything referencing the new values).
- On `projects`: `reviewed_at timestamptz`, `reviewed_by text → users.id`,
  `rejection_reason text`, `queued_at timestamptz` (when it entered `pending` — the queue is
  ordered by this, not by `created_at`, so a resubmission goes to the back of the line).
- Index `projects_status_queued_idx` on `(status, queued_at)`.
- On `publishers`: `trusted_at timestamptz` — set by staff, feeds `auto_approve_trusted`.

**Status machine**

```
draft ──publish──▶ [review off] published
      └─publish──▶ [review on]  pending ──approve──▶ published
                                        └─reject───▶ rejected ──edit+resubmit──▶ pending
```

- `published` and `rejected` are both terminal-until-edited; editing a `rejected` project and
  resubmitting sets `pending` and clears `rejection_reason`.
- Approving stamps `launched_at = now()` **only if unset**, preserving the idempotent-publish
  behaviour already in `publishProject` — a project must not jump into a fresh ranking window
  because a moderator was slow.
- Turning the toggle **on** does *not* retroactively unpublish anything. Only new publishes are
  gated. Stated explicitly because it is the first thing someone will assume otherwise.

**API — existing routes that change**
- `POST /v1/projects/:id/publish`: reads `moderation.review_required`; sets `pending` +
  `queued_at` when on (unless the publisher is trusted and `auto_approve_trusted` is on),
  `published` otherwise. Response gains the resulting `status` so the dashboard can say which
  happened.
- `getProjectBySlug`'s owner-preview branch already shows non-published projects to their owner;
  it needs no change beyond returning `rejectionReason` when the viewer is the owner.
- `publicProjectFilter` needs no change — it filters on `status = 'published'`, so `pending` and
  `rejected` are invisible to the public for free.

**API — new**
- `GET /v1/admin/projects` — `status`, `q`, `island`, `categoryId`, `publisherId`, `from`, `to`,
  `sort`, `limit`, `offset`. Returns the full record including drafts, deleted and shadow-banned
  rows, each with its publisher and counts.
- `GET /v1/admin/projects/:id` — everything: full description, both images, publisher with
  contact email, upvote and comment counts, moderation history from the audit log.
- `POST /v1/admin/projects/:id/approve` — `{ note?: string }`.
- `POST /v1/admin/projects/:id/reject` — `{ reason: string }`, **required**, min 10 chars. It is
  shown to the maker.
- `POST /v1/admin/projects/:id/unpublish` — `{ reason: string }`, back to `draft`; for something
  that got through and shouldn't have.
- `POST /v1/admin/projects/:id/restore` — clears `deleted_at` on a soft-deleted project.
- `POST /v1/admin/publishers/:id/trust` and `/untrust`.

**Web (`admin`)** — `_staff/queue.tsx`: a list ordered by `queued_at asc` showing the age of each
item, a detail drawer rendering the project exactly as the public detail view would (so a
moderator reviews what visitors will see), and Aprovar / Rejeitar / Pedir alterações. Keyboard
shortcuts (`a` / `r` / `j` / `k`), because a queue is a repetitive surface.

**Web (`web`)** — the releases dashboard learns two new badges (`Em revisão`, `Rejeitado`,
alongside the existing draft/published) and shows `rejectionReason` inline with an "Editar e
reenviar" action. `releases-item.tsx` and `use-project-actions.ts` are the touch points.

**Done when:** with the toggle on, a maker's publish lands in the queue and stays off the
homepage; an approval puts it in the current week's ranking; a rejection shows the reason in the
maker's dashboard and lets them resubmit.

---

## A4. Shadow ban — users and projects

A middle sanction between "leave it alone" and a hard ban: the account keeps working, the author
keeps seeing their own content, and nobody else does.

**Decided on approval, 2026-08-30 — this is a *disclosed* hide, not a silent one.** The affected
maker sees a banner on their own project (and on their profile, when the ban is on the account)
saying it is hidden, with the reason the admin typed. Two consequences worth stating plainly:

- The name is now a slight misnomer — a true shadow ban is silent. The columns and endpoints keep
  the `shadow_ban` name for continuity; **all UI copy says "Ocultado"**, never "shadow ban".
- Telling someone makes ban evasion more likely than the silent version would. That is the
  accepted trade for not sanctioning people in secret, and it is why every hide carries a
  written reason.

**Rankings are never rewritten.** The earlier draft proposed excluding a banned user's upvotes
from every project's `upvoteCount`; that is dropped. A hide removes content from public view and
nothing else — other projects' totals, and any archived `/rankings/$week` page, stay exactly as
they were. (A hidden *project* naturally leaves the public list and the current leaderboard,
because both read the same visibility predicate. Its own vote rows are left intact, so unhiding
restores it with its count unchanged.)

**DB**
- On `users`: `shadow_banned_at timestamptz`, `shadow_banned_by text → users.id`,
  `shadow_ban_reason text`.
- On `projects`: the same three columns.
- Partial indexes `users_shadow_banned_idx` / `projects_shadow_banned_idx`
  `WHERE shadow_banned_at IS NOT NULL` — the flagged set stays tiny.

**Semantics — enforced in three places, all in the services layer**

| Surface | Rule |
|---|---|
| `publicProjectFilter` | adds `isNull(projects.shadowBannedAt)`, and excludes projects whose publisher is hidden. Covers the list, the leaderboard and the maker profile in one predicate. |
| `getProjectBySlug` | a hidden project resolves normally **for its owner**, 404 for everyone else. Reuses the existing `isOwner` branch, and returns the reason when the viewer is the owner. |
| `listComments` | comments by hidden users are dropped for everyone except that user, who still sees their own. Reply counts are computed after the filter. |

`serializeProject` is **not** touched — upvote counting is unchanged, per the ranking decision
above. That also keeps the in-memory `sort=upvotes` path in `projects-services.ts` exactly as it
is.

**API**
- `POST /v1/admin/users/:id/shadow-ban` — `{ reason: string }` (min 10), `DELETE` to lift.
- `POST /v1/admin/projects/:id/shadow-ban` — same shape, `DELETE` to lift.
- Hard ban stays with Better Auth (`/v1/auth/admin/ban-user`), surfaced in the same UI so the
  choice between the two is one dialog rather than two screens.
- **Owner-facing disclosure:** `GET /v1/projects/mine` and `getProjectBySlug`'s owner branch
  return `{ hidden: true, hiddenReason, hiddenAt }`; `GET /v1/makers/me` returns the same shape
  for an account-level hide. Nothing leaks to other viewers — the fields are only serialized when
  the requester owns the record.

**Web (`admin`)** — on the user and project detail pages, a "Sanções" card showing the current
state (Ativo / Ocultado / Banido), who applied it, when, and why, with the reason required before
the button enables. Hidden rows are tinted and labelled in every list.

**Web (`web`)** — a maker sees an alert on the affected item in the releases dashboard
("Este projeto está oculto") with the reason, and a matching notice on their own profile when the
whole account is hidden. Same component both places.

**Done when:** a hidden user posts a comment, sees it in their own thread with a notice explaining
why it is hidden, and a second browser — logged out, and logged in as someone else — never sees
it; and no upvote count anywhere on the site changes as a result.

---

## A5. Comment moderation

Today an admin can only hard-delete a comment, via the same `DELETE /v1/comments/:id` a user
calls on their own; the tombstone replaces the body with "Comentário removido." and drops the
author. That is right for a user deleting their own, and wrong for moderation: it destroys the
evidence and cannot be undone.

**DB** — on `comments`: `hidden_at timestamptz`, `hidden_by text → users.id`,
`moderation_reason text`.

**Semantics**
- **Hidden** — row and body intact, invisible to the public, fully visible in the admin app,
  reversible. Staff-only. This is the default action.
- **Deleted** — the existing `deleted_at` tombstone; keeps its slot in the thread so replies
  aren't orphaned. Reachable by staff too, for content that must not stay readable even to staff.
- A hidden **parent** hides its replies from the public thread as well, but they stay
  individually reversible — un-hiding the parent restores whatever wasn't hidden on its own.

**API**
- `listComments` gains `isNull(comments.hiddenAt)` for non-staff viewers. Staff get an
  `includeHidden` flag from the admin endpoint, never from the public one.
- `POST /v1/admin/comments/:id/hide` — `{ reason: string }`; `DELETE …/hide` to unhide.
- `DELETE /v1/admin/comments/:id` — staff delete, `{ reason: string }`, writes audit.
- `GET /v1/admin/comments` — `projectId`, `userId`, `q`, `state` (`visible|hidden|deleted`),
  `from`, `to`, paginated, newest first. This is also how a moderator reads one user's entire
  comment history before deciding on a ban.
- Bulk: `POST /v1/admin/comments/bulk` — `{ ids: number[], action: "hide" | "delete", reason }`,
  capped at 100 ids. One audit row per comment, one request.

**Web (`admin`)** — `_staff/comments.tsx`: a moderation feed with checkbox selection, inline
project/author links, and the reason dialog. Each project's detail page embeds the same table
scoped to that project — that is the "moderation for the project" view.

**Done when:** hiding a comment removes it from the public thread without changing the reply
structure, un-hiding restores it exactly, and both actions appear in the audit log.

---

## A6. Audit log

Every mutation under `/v1/admin/*` writes one row. No exceptions, including the settings page.

**DB** — `moderation_actions`:

| column | type |
|---|---|
| `id` | serial PK |
| `actor_id` | `text → users.id` |
| `action` | varchar — `project.approve`, `project.reject`, `user.shadow_ban`, `comment.hide`, `setting.update`, … |
| `target_type` | pgEnum `project \| user \| comment \| publisher \| setting \| report` |
| `target_id` | varchar (ids are mixed serial/text across tables) |
| `reason` | text, nullable |
| `metadata` | jsonb — before/after for reversible actions |
| `created_at` | timestamptz |

Indexes on `(target_type, target_id, created_at desc)` and `(actor_id, created_at desc)`.

**Implementation** — a small `withAudit` wrapper in the admin module rather than a Fastify hook,
so the audit row is written in the **same transaction** as the mutation. A hook firing on
`onResponse` would log actions that rolled back.

**API** — `GET /v1/admin/audit` with `actorId`, `targetType`, `targetId`, `action`, `from`, `to`.
Read-only forever: no update, no delete endpoint, not even for admins.

**Web** — `_staff/audit.tsx`, plus a "Histórico" section embedded on every project/user detail
page filtered to that target.

**Done when:** every action taken anywhere in the admin app appears in the log with actor, reason
and timestamp, and no endpoint exists that can alter it.

---

## A7. User reports (the queue's real feeder)

Without a report button, moderation depends on staff happening to read every thread. This is
small, and it is what makes A5 useful.

**DB** — `reports`: `id`, `reporter_id → users.id`, `target_type` (`project | comment | user`),
`target_id`, `reason` pgEnum (`spam | offensive | misleading | not_cabo_verde | broken_link |
other`), `details text`, `status` pgEnum (`open | reviewing | resolved | dismissed`),
`resolved_by`, `resolved_at`, timestamps. Unique on `(reporter_id, target_type, target_id)` so
one person cannot inflate a count.

**API**
- `POST /v1/reports` — authenticated, rate-limited 10/hour keyed by user id.
- `GET /v1/admin/reports` — grouped by target with a report count, `open` first.
- `POST /v1/admin/reports/:id/resolve` — `{ outcome, note }`; resolving a group resolves every
  open report on that target.

**Web (`web`)** — a "Reportar" item in an overflow menu on the comment item and the project
detail view.

**Web (`admin`)** — `_staff/reports.tsx`: an inbox grouped by target showing "5 relatórios ·
spam", one click through to the target with the moderation actions already at hand.

**Done when:** a visitor reports a comment, it appears in the admin inbox within a refresh, and
resolving it closes every report on that comment.

---

## A8. User management

Mostly free once §0 lands — the Better Auth admin plugin already implements it.

**Free from the plugin:** list/search users, set role, hard ban with expiry, unban, revoke
sessions, remove user, impersonate.

**Needs building:**
- `GET /v1/admin/users/:id` — the aggregate the plugin doesn't have: publisher profile,
  onboarding answers, projects by status, comment count, upvotes cast and received, sanction
  state, and the audit history for that user.
- Impersonation guardrails: **admin-only**, capped at 30 minutes, writes an audit row on start
  *and* stop, and the admin app shows a persistent red bar while impersonating. The
  `sessions.impersonated_by` column already exists to make this visible in the DB.
- Deleting a user is a cascade minefield — `publishers`, `projects`, `comments` and
  `project_upvotes` all cascade from `users.id`, so a delete silently removes their projects and
  every vote they ever cast, changing historical rankings. **Decision: the admin UI does not
  expose user deletion in phase 1.** Hard ban is the terminal action. GDPR-style erasure gets its
  own design when it is actually needed.

**Done when:** staff can find a user by email or handle, see everything they've done on one page,
and change their role or ban them from it.

---

## Suggested additions — beyond what was asked

Ordered by how much they pay back. The first three are worth doing in the same batch.

### A9. Vote-integrity console *(high value, low cost)*

`project_upvotes.ip_address` and `user_agent` are already recorded and have never been read. One
screen: votes grouped by IP within a week, accounts sharing an IP or user-agent fingerprint,
accounts created and voting within N minutes of each other, and votes on a project by account
age. Plus `POST /v1/admin/projects/:id/invalidate-votes` with `{ userIds[], reason }` — a soft
`invalidated_at` column on `project_upvotes` excluded from counts, never a hard delete, so a
mistaken call is reversible. This is the difference between a leaderboard people trust and one
they don't, and the data is already sitting there.

### A10. Overview dashboard *(the landing page for `_staff/index.tsx`)*

Queue depth and oldest waiting item; open reports; signups, submissions, publishes, comments and
votes for the last 7 days vs. the previous 7; this week's live top 10; projects by island and by
category. All from existing tables — no new writes, one `/v1/admin/stats` endpoint.

### A11. Categories CRUD *(fills a real gap)*

Categories are seeded and there is **no create/update endpoint anywhere** — the only way to add
one today is a DB edit. `projects.category_id` is `onDelete: "restrict"`, so the UI must show the
project count and offer "merge into another category" rather than a delete that will fail.

### A12. Weekly cycle control

Read-only per-week leaderboard, plus the ability to schedule a launch into a future week by
setting `launched_at` — the column was split from `published_at` for exactly this, as
[`schemas/projects.ts`](../api/src/db/schemas/projects.ts) says in its own comment. Add a
`featured_at` column for pinning one project per week to the top of the homepage.

### A13. Media browser

`file_uploads` records every presigned upload, including ones the maker abandoned mid-stepper. A
list by user/date/type, a preview grid, and an orphan sweep (keys referenced by no project) — R2
costs money for files nobody will ever see.

### A14. CSV export

Users, projects and weekly rankings as CSV from the filtered list views. For a project of this
kind, the first grant report or partner conversation will ask for exactly this.

### A15. Staff account hardening

Given what these accounts can do: require a verified email for any staff role, a shorter Better
Auth session `expiresIn` for staff, a per-IP rate limit on the admin login route, and keeping the
admin origin unlinked from the public site.

### Deferred, listed so they aren't re-litigated later

- **Notification emails** on approve/reject/ban — the reason field is stored from day one so the
  templates have content when `MVP.md`'s deferred email infra lands.
- **In-app moderation notice** to the affected maker/commenter.
- **Saved views / assignment** on the queue — only worth it with more than one moderator.
- **Auto-moderation** (link/keyword heuristics) — needs real spam volume to tune against.
- **2FA for staff** — Better Auth has a plugin; low priority while the team is small.

---

## Out of scope

Multi-tenant staff orgs, a ticketing system, per-field project editing by staff (staff approve or
reject; the maker edits), analytics beyond the counters in A10, moderation of external content,
and any public-facing transparency report.

---

## Migrations

Each in its own file, in this order. `0012` is next — `0011_lovely_barracuda` is the current head.

| # | Contents |
|---|---|
| `0012` | `ALTER TYPE project_status ADD VALUE 'pending' / 'rejected'` — alone, because Postgres cannot use a new enum value in the transaction that added it. |
| `0013` | `projects`: review columns + shadow-ban columns + indexes. `publishers.trusted_at`. |
| `0014` | `users` shadow-ban columns + partial index. |
| `0015` | `comments` hide columns. |
| `0016` | `app_settings`. |
| `0017` | `moderation_actions` + target-type enum. |
| `0018` | `reports` + reason/status enums. |
| `0019` | *(A9, if built in this batch)* `project_upvotes.invalidated_at`, `projects.featured_at`. |

Every column is nullable or defaulted, so existing rows stay valid and the public site behaves
identically until a staff member does something.

---

## Config additions

`api/.env.example`:

```
# add the admin origin (feeds CORS and Better Auth trustedOrigins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

`ADMIN_SEED_NAME` / `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` already exist and finally get used.

`admin/.env.local`: `VITE_APP_API_URL`, `VITE_APP_ASSETS_URL` (as in A0).

No new third-party services.

---

## Testing

Following the existing `api/tests/e2e` pattern (testcontainers Postgres, 80 tests currently
passing across 6 files):

- `admin.access.test.ts` — the §0 regression: `user` gets 403 from `/v1/admin/*` **and** from
  `/v1/auth/admin/set-role`; `admin` passes; an anonymous request gets 401.
- `admin.review.test.ts` — publish with the toggle off → `published`; toggle on → `pending` and
  absent from `GET /v1/projects`; approve → published and in the week's ranking with
  `launched_at` unchanged if already set; reject → reason visible to the owner only; resubmit →
  `pending`.
- `admin.shadow-ban.test.ts` — the three enforcement points, each asserted from three viewpoints
  (the hidden user, another user, logged out), plus: the owner receives the reason, nobody else
  does, and `upvoteCount` is unchanged by a hide.
- `admin.comments.test.ts` — hide/unhide round-trips, a hidden parent hides replies publicly, the
  reply structure survives, the bulk cap is enforced.
- `admin.audit.test.ts` — every admin mutation writes exactly one row; a rolled-back mutation
  writes none.

---

## Build order

1. **§0 + A1** — the security fix, roles, staff hook, admin seed. Ships alone, no UI.
2. **A0** — the `admin` workspace shell, login, guard, empty pages.
3. **A6** — audit log first, so every later feature is auditable by construction rather than
   retrofitted.
4. **A2 + A3** — settings, the toggle, and the review queue. The headline feature.
5. **A5** — comment hide/delete + the moderation feed.
6. **A4** — shadow ban, once there are surfaces to apply it from.
7. **A7** — reports, which make A5 self-feeding.
8. **A8 + A10** — user detail aggregate and the overview dashboard.
9. **A9, A11–A15** as prioritized.

DB → API → web within each step, matching how the rest of the repo is built.

---

## Decisions taken on approval (2026-08-30)

The four questions this document opened with are now closed. Recorded here because each one is
load-bearing somewhere above.

1. **One staff role, `admin`.** No `moderator` tier. `staffRoleValues` stays an array so adding
   one later touches one line (A1).
2. **`moderation.review_required` ships `false`** — behaviour identical to today until it is
   switched on from the settings page (A2).
3. **Edits to already-published projects are not gated** in phase 1. They are written to the
   audit stream instead, so an abuse pattern is visible before it is legislated against (A6).
4. **A hide never rewrites rankings, and is disclosed to its owner with the reason** (A4). This
   replaced the silent, vote-invalidating design in the first draft.
