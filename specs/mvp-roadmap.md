# Hub Digital MVP Roadmap

## Current Baseline

Branch: `dev`

The project already has the main foundation for an MVP:

- Web app built with React, Vite, Mantine, TanStack Router, TanStack Query, and Better Auth.
- API built with Fastify, Drizzle, PostgreSQL, Better Auth, Swagger, CORS, cookies, rate limiting, and Vitest.
- Authentication and protected routes are wired.
- User onboarding is implemented end to end and covered by API E2E tests.
- Dashboard, releases, onboarding, and submit-project routes exist.
- Project, category, publisher, and auth database schemas exist.
- Category and user/publisher seed scripts exist.

Known validation status:

- `pnpm web:build` passes.
- `pnpm --filter @hubdigital/api test` passes.
- `pnpm api:build` currently fails because `api/src/plugins/error-handler.ts` reads properties from an `unknown` error value.

## MVP Definition

The MVP should let a visitor discover Cape Verde digital projects and let an authenticated, onboarded user submit a project.

The first MVP release should include:

- Public landing/project listing page.
- Authentication with Better Auth.
- Required onboarding before dashboard access or project submission.
- Submit-project flow with validated data.
- Project creation API.
- Project listing API.
- Project detail route by slug.
- Categories seeded and selectable.
- Basic launch/release dashboard view.
- Production build passing for both API and web.
- Minimal E2E or integration tests for the core happy paths.

The first MVP should not include unless needed:

- Comments.
- Advanced moderation workflow.
- Complex analytics.
- Payment or sponsorship.
- Notifications.
- Full admin panel.
- Rich media hosting beyond a simple initial approach.

## Implementation Roadmap

### Phase 1 - Stabilize The Branch

Goal: make `dev` buildable and safe to continue from.

Tasks:

- Fix `api/src/plugins/error-handler.ts` TypeScript handling for `unknown` errors.
- Run `pnpm api:build`.
- Run `pnpm web:build`.
- Run `pnpm --filter @hubdigital/api test`.
- Decide whether `web/tsconfig.tsbuildinfo` should remain tracked. It is generated during build and currently creates working tree noise.

Exit criteria:

- API build passes.
- Web build passes.
- Existing API tests pass.
- Working tree remains clean after validation, except for intentional changes.

### Phase 2 - Define Project API Contract

Goal: turn the existing project/category database model into a usable backend contract.

Tasks:

- Review and correct project schema fields.
- Add category read endpoints.
- Add project create schema with Zod validation.
- Add project list schema with pagination and category filters.
- Add project detail schema by slug.
- Decide MVP image handling:
  - option A: accept external image URLs for logo/banner.
  - option B: add upload/storage later.
- Add API response types that match existing frontend `PostResponse`, `ItemResponse`, and `ListResponse` patterns.

Exit criteria:

- API contract is documented in code and visible in Swagger.
- Frontend has a stable shape to integrate with.

### Phase 3 - Implement Project Backend

Goal: support creating and reading projects from PostgreSQL.

Tasks:

- Add `api/src/modules/projects`.
- Implement project service methods:
  - create project
  - list projects
  - get project by slug
- Register routes under `/v1/projects`.
- Add route protection for project creation.
- Require authenticated user to have a publisher profile before creating a project.
- Generate unique slugs from project names.
- Add basic duplicate handling for project slug/name.
- Add tests for:
  - unauthenticated create rejection
  - onboarded user can create project
  - list projects returns created projects
  - project detail returns by slug

Exit criteria:

- Project creation and listing work through API tests.
- API build and tests pass.

### Phase 4 - Connect Submit Project UI

Goal: make the existing stepper submit real project data.

Tasks:

- Replace placeholder submit context with real form state.
- Add Zod validation for each submit step.
- Connect project details fields:
  - name
  - short description
  - website URL
  - full description
  - logo URL
  - banner URL
- Connect category and metadata fields:
  - category
  - pricing
  - business model
  - access
  - project stage
  - audience
  - platform
- Update review step to show actual entered data instead of placeholders.
- Add submit mutation using TanStack Query.
- Show loading, success, and error states.
- Redirect to project detail or dashboard release view after successful submit.

Exit criteria:

- An onboarded user can submit a project from the web UI.
- The submitted project is persisted by the API.
- The review screen reflects real form data.

### Phase 5 - Public Discovery Experience

Goal: make the product useful for visitors.

Tasks:

- Connect landing/project list page to real API data.
- Add loading, empty, and error states.
- Add category filters if available within scope.
- Add project detail route by slug.
- Show project name, short description, full description, logo, banner, website link, category, and metadata.
- Keep sample static projects only as fallback/demo data if needed.

Exit criteria:

- Visitors can browse real submitted projects.
- Visitors can open a project detail page.
- Public pages build successfully.

### Phase 6 - MVP Polish And Guardrails

Goal: make the first release coherent and hard to break.

Tasks:

- Make onboarding enforcement consistent.
- Improve Portuguese/Cape Verdean Portuguese copy and fix encoding issues such as `descriÃ§Ã£o`.
- Add sensible form constraints and messages.
- Add basic 404 and API error UI.
- Add seed data for local demo.
- Confirm Docker/Postgres setup works from clean checkout.
- Update README with setup, env vars, migrate, seed, test, and build commands.

Exit criteria:

- A developer can run the project from README instructions.
- The core MVP flow works locally from a clean database.

## Suggested Build Order

1. Fix API build blocker.
2. Implement project backend routes and tests.
3. Wire submit-project form to the backend.
4. Wire public project listing/detail to the backend.
5. Polish onboarding enforcement, copy, and setup docs.

This order keeps the work focused on the critical product loop:

`sign in -> onboard -> submit project -> project appears publicly -> visitor opens project`

## Completion Estimate

Current MVP completion estimate: 55-65%.

Reasoning:

- Auth, onboarding, routing, dashboard shell, and database foundations are already present.
- The most important missing piece is the real project submission and discovery loop.
- The API build failure must be fixed before the branch can be treated as stable.

## Next Step

Start with Phase 1:

- Fix the API build error in `api/src/plugins/error-handler.ts`.
- Re-run API build, web build, and API tests.
