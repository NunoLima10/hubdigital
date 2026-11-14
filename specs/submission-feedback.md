# Submission feedback and improvement backlog

Collect feedback before changing the implementation. The completed roadmap remains a delivery record; this document tracks problems found during the builder's evaluation.

## SUB-01 — Saving blocks project creation

- Reported: 2026-10-13.
- Priority: blocking. Address before further submission polish.
- Status: fixed on 2026-10-13; regression and browser checks passed.
- Builder report: project creation stays on saving, and the builder cannot continue or do anything.
- Impact: a builder cannot complete or publish a project, and cannot tell whether their draft is safe.
- Reproduction: a deliberately unresolved draft request reproduced the saving lock. The user’s exact original request failure was not traced; the confirmed UI coupling and missing request deadline are corrected.

### What the code shows

`SumbmitProvider` uses the same `isPending` state for automatic draft saving, explicit saving and publication. `StepLayout` disables Next, Back, Save and Publish while that state is true. Automatic saving therefore blocks navigation for the duration of a request. The state is released in `finally`, after the request settles.

The shared Axios client does not configure a timeout, and these draft requests do not provide their own timeout or cancellation. A request that remains pending could therefore keep the form locked. This is a plausible failure path, not a confirmed diagnosis of the reported incident. Repeated saves and a single stalled request must be distinguished during reproduction.

Relevant files:

- `web/src/modules/submit/context/sumbmit-form.tsx`
- `web/src/modules/submit/ui/components/step-layout/step-layout.tsx`
- `web/src/api/api.ts`

### Required behavior

- Background saving must let the builder continue editing and move between form steps.
- Distinguish background saving, explicit saving and publication in state and copy. Disable only actions that would conflict with the active operation.
- A stalled request must end in a bounded, recoverable state with an understandable message and a retry action.
- Preserve entered values and the available recovery copy after failure; distinguish browser recovery from a confirmed server save.
- Serialize/coalesce saves so that the newest changes are eventually saved without overlapping writes or a continuous save loop.
- Publication must wait for the latest snapshot to be persisted, prevent duplicate submissions and recover when either saving or publication fails.
- Retrying after a lost response must reuse the existing project/creation key.

### Verification for the implementation pass

Reproduce the reported case in the builder's active environment and inspect draft creation/update requests before assigning a root cause. Exercise slow responses, requests that never settle, offline/server failures, typing during a save, moving between steps and retry after a lost response. Confirm recovery after refresh and that the final published project contains the latest edits with no duplicate project.

## Further feedback

Append each reported issue with the current behavior, why it is a problem, the desired outcome and acceptance checks. Keep observations separate from hypotheses. Agree on the collected changes before starting the implementation pass.

## SUB-01 implementation and verification

Autosave now has its own saving state, separate from publication. Next/Back remain available during automatic or explicit draft saving. Draft writes remain serialized; edits made during an in-flight save are coalesced into a subsequent snapshot. Save is temporarily disabled while that same write runs. Each submission request has a 15-second timeout; failures release the controls and retain the draft/recovery data, without repeatedly retrying the same failed snapshot.

Publication can be requested during autosave. It claims a separate lock before validation, awaits the active write, persists the latest snapshot and then publishes. The form is temporarily disabled/inert during publication to prevent changes to the submitted snapshot. Invalid or failed publication releases the lock. Retries reuse the draft ID or original creation key.

Six component regressions passed: navigation during an unresolved save, timeout and recovery with creation-key reuse, coalesced edits, failed-update retry using the existing ID, release after invalid publication, and a single publication waiting for current data. Run with `pnpm --dir web test`.

Collaborative-browser verification used an isolated adapter for project writes: Next stayed enabled during a stalled request, the second step opened, Back stayed enabled, the request deadline showed recoverable failure, and explicit retry reached “Rascunho guardado” with the same creation key. No test project was written to the API. The pre-existing stale phase-3 test recovery was backed up during the check. The active form overwrote its restoration with the new test recovery before navigation; the isolated recovery was then removed. No user project records were modified. The test adapter was removed by navigation. UI lint and TypeScript checks passed.

Final validation: the web production build passed for browser and server bundles. Changed files passed ESLint and `git diff --check`. Browser cleanup confirmed no isolated test recovery or adapter remained.

## SUB-02 — Builder-first location and shorter submission pages

- Reported and implemented: 2026-10-13.
- Keep the category picker unchanged.
- Replace the team questionnaire with one optional project base. The publisher remains the owner; accepted creator invitations provide collaboration/credit separately.
- Remove team mode, extra-base controls, service area, and languages/team/help controls from submission and editing. Existing stored optional metadata is not destructively erased; no new compatibility adapter or database migration is introduced.
- Cabo Verde asks for island and a written city/locality, with no municipality picker. Changing country or island clears obsolete finer regions and a previous pin.
- Show ten curated country shortcuts (Cabo Verde, Portugal, United States, France, Netherlands, Luxembourg, Senegal, Brazil, Spain, Italy), then “Outro país” with the worldwide searchable picker. Existing rare-country values remain selectable and visible.
- Encourage selecting a public map point. Foreign countries open the map directly; Cabo Verde can open it with “Marcar no mapa.” An island choice focuses the map on that island. Points stay optional; approximate precision remains the default. Coordinate inputs are tucked under “Introduzir coordenadas.”
- Show Cabo Verde connections as multi-select chips matching the platform controls. Copy uses “Base” rather than assuming a team.
- Split the long second page into a four-step flow: Projeto → Detalhes → Base → Revisão. The numbered stepper is clickable, has an explicit current step and works while autosave runs; publication locks navigation. Desktop captions explain each step, while mobile keeps compact labels.
- Review reflects the streamlined questions. Published editing retains access to the same single-base controls. Source-code fields have one semantic section heading.

Data now collected in the Base step: country; optional Cabo Verde island; optional written locality; optional public pin with approximate/exact precision; and optional multiple Cabo Verde connections. No automatic inference of creator identity, country, pin or local connection.

Country shortcuts are a curated UX choice, not a current population ranking. [INE’s Census 2021 migration report](https://ine.cv/wp-content/uploads/2022/11/migracao.pdf) informs the destination choices; its recent-emigration figures do not measure the entire present diaspora. All other countries remain available.

Recovery accepts the new fourth step. Validation and API error paths send location issues to Base rather than Detalhes. An unfinished country-specific service-area answer from the retired control is cleared during conversion so it cannot invisibly prevent publication; complete stored answers remain intact.

Verification: ten frontend regressions passed, covering saving/retries, publication ordering, four-step recovery, coordinate-error navigation, the retired unfinished-answer case and recovery of categories/connections entered before a name. Browser interactions verified country shortcuts, Cabo Verde island plus written place, an approximate island-map pin, multiple connection chips, Portugal clearing stale CV regions/pin, and Japan through “Outro país.” Base and review worked at 390 px with no horizontal overflow. The isolated check used an empty-name draft, made no project API writes, unmounted before restoring browser recovery, and removed its temporary recovery entry. Snapshot image capture failed in the collaborative preview; DOM/layout checks and interactions succeeded.

Further refinement can collapse optional media in Projeto if mobile review finds that page still too long. Retiring unused stored fields from the database is a separate data-cleanup decision, not needed to unblock this simpler form.

The recovery work check now considers every changed form value, including categories and local connections entered before naming the project. Those answers get a browser recovery copy; server autosave still starts only after a name is provided. Step numbers use larger semibold type for readability while retaining the existing theme colors.

Final SUB-02 checks: shared compilation, web TypeScript, changed-file ESLint, ten frontend tests, `git diff --check`, and browser/server production bundles passed. The read-only attempt to open a published editor did not reach an edit button in the isolated browser dashboard; its shared base controls were typechecked, while the create-flow base widget was exercised directly. The original submission tab remains open for review.

## SUB-03 — Fewer link types, with icons

- Reported and implemented: 2026-10-21.
- Builder report: the link-type list was too long; pricing and email did not belong there.
- Link types are now Website, Loja de aplicações, Código-fonte, Demonstração, Documentação and Outro. Pricing is already covered by Monetização; email/WhatsApp contact is left to comments and feedback; community and crowdfunding links use Outro with a custom button text.
- App Store and Google Play stay one `app_store` kind and are recognised from the URL host (`apps.apple.com`/`itunes.apple.com`, `play.google.com`) for the icon and the default secondary label. Other stores show a generic phone icon.
- Each type has an icon on the public page, in the submission form and in click metrics (metrics show the generic store icon, since link stats carry no URL).
- Migration `0028_simplified_link_kinds` converts pricing/community/crowdfunding rows to `other` with their former name as label, removes email/WhatsApp rows and recreates the enum. Development data only used website, repository and app store, so no link was lost. Stored revision proposals were empty and were not converted.
