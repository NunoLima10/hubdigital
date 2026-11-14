# Hub Digital — Product backlog

This document tracks unfinished product work, summarizes the current delivery, and records implementation decisions. Deferred items remain out of the current work cycle.

## Delivered in the current work cycle

- **Duplicate-link validation:** normalize equivalent destinations, show inline duplicate feedback, and enforce checks during publication, live edits, moderator approval, and restoration. Existing drafts remain editable; private project details are not disclosed.
- **Discovery filters:** category, island, availability, pricing, project stage, and community requests work together inside the search modal. Filters are shareable through the URL, with clear-all and active-filter count.
- **Mobile map:** the map fills the available viewport. Filters and project lists open on demand, selected projects use compact previews, grouped markers expose all their projects, and camera position and selection survive returning from details. Small phones and landscape retain the map as the primary view.
- **Map tiles:** replace the unconfigured CARTO raster layer, which now requires a key, with an OpenStreetMap default. A dedicated provider remains configurable for higher traffic.
- **Existing-user collaboration:** search profiles, invite collaborators with contribution roles, edit roles, and remove memberships. Invitations must be accepted before collaborators receive public credit. The owner keeps publishing and management control.
- **Maker credits and profiles:** show avatars, profile links, and contribution roles above comments; separate owned projects from accepted collaborations on profiles.
- **Project requests:** submission and editing support feedback, testers, contributors, development, design, marketing, co-founders, mentoring, customers, partnerships, and investment. Requests appear below comments and in discovery; collaboration requests produce a quiet tag.
- **Frontend organization:** extract duplicate-link checks, map project lists, collaborator management, public maker credits, and project requests into focused hooks/components. Reuse collaborator management in submission review, published-project editing, and community management.

## Verification

During commit preparation, all 260 API tests and 46 frontend tests pass, along with TypeScript checks for the API, website, and admin. API, website, and admin production builds also pass. The browser smoke script covers mobile layouts, touch panning and pinch-to-zoom, map state restoration, shareable filters, duplicate feedback, collaborator management, maker credits, project requests, and profile sections; its syntax was checked, but the browser scenarios were not rerun during commit preparation.

The optional collaborator role is included in `0000_baseline.sql`. The current changes consolidate earlier migrations and rewrite the baseline and journal. Fresh-database migration is covered by the API tests. Existing databases need a separately reviewed upgrade strategy before deployment; do not reapply the baseline or delete a database volume to update them. Commit preparation did not apply migrations to the application database or deploy these changes.

## Implementation decisions

- Duplicate validation only compares stored URLs; it never fetches arbitrary submitted URLs.
- Extra discovery controls stay inside the modal.
- Mobile maps do not show a persistent half-screen panel.
- Makers appear above comments; community requests appear below comments.
- Collaborators need an existing platform profile and must accept their invitations.
- Email invitations remain deferred until transactional email is available.
- Refactoring stays incremental and tied to product work.

## P2 — After launch

### Error monitoring

Record client errors and API failures so production problems can be investigated. Not planned for the current work cycle.

### Curated collections

Consider useful collections such as **Made in Santiago**, **Open source**, **Student projects**, and **Looking for collaborators** after launch. Not planned for the current work cycle.

### Community awards

Consider awards for projects and makers after launch. The award criteria, ownership, frequency, revocation rules, and relationship to weekly rankings must be defined before implementation. Not planned for the current work cycle.

### Complete footer

Add About, Community guidelines, Privacy, GitHub, Contact, and Submit a project links. Define the content and information architecture before implementation.

### Project updates and changelogs

Let makers publish structured progress updates and release notes.

### Maker and organization verification

Add verification for authentic makers and organizations.

### Sticky submission buttons

Keep Back, Save draft, and Next visible during long submission steps.

### Better moderation feedback

Explain why a project needs changes and what the maker should update.

### Follow projects and makers

Allow people to follow projects and makers.

### Notifications

Notify people about replies, votes, moderation decisions, followed projects, and project updates.

### Weekly email digest

Send an optional summary of launches, discussions, and project updates.

### Pinned maker comment

Let a maker pin an important explanation or update in the comments.

### Invite collaborators by email

Allow owners to invite people who do not yet have a Hub Digital account. Build this only after transactional email is enabled; invitations must be linked to the project.

### Image optimization

Resize oversized uploads, generate thumbnails, and serve efficient formats.

### Product analytics with PostHog

Measure the journey from discovery to project view, destination visit, signup, and publication.

### Frontend browser tests

Cover sign-in, submission, publication, voting, commenting, and moderation in a real browser.

### More frontend component tests

Increase coverage for important components, routes, forms, and interactive states.

## Needs definition

These ideas are worth retaining but are not ready to implement until their scope and success criteria are agreed.

- **Project ranking history:** decide where it appears, which periods are shown, and whether it belongs on project pages, profiles, or both.
- **Admin verification and moderation tools:** define the moderation workflow, roles, actions, audit log, and appeals before expanding the admin interface.
- **Ranking improvements:** document the exact weekly ranking formula, tie-breakers, rollover behavior, and resistance to vote manipulation.
- **Cache invalidation:** inventory the caches in use, define freshness expectations per resource, and choose event-driven or time-based invalidation for each one.
