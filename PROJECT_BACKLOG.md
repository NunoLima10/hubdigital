# Hub Digital — Product backlog

This document is the source of truth for unfinished product work. Priorities are ordered within each section. Remove an item when it is complete, and record new implementation decisions under that item.

## Priority guide

- **P0 — Now:** ready to implement and important before launch.
- **P1 — Next:** start after the P0 work is complete.
- **P2 — Later:** valuable, but not required for launch.
- **Needs definition:** requires a product or technical decision before implementation.

## P0 — Work now

### 1. Duplicate-link validation

Prevent the same project destination from being published more than once.

To do:

- [ ] Normalize submitted URLs so harmless differences such as a trailing slash do not bypass the check.
- [ ] Add an API/database check for links already used by another non-deleted project.
- [ ] Allow an owner to save their own unchanged link while editing a project.
- [ ] Show a clear inline error in the submission flow with a link to the existing project when available.
- [ ] Add API and submission-form tests for duplicate and valid links.

Done when: a duplicate link cannot be published, editing the original project still works, and the user understands how to resolve the error.

Decision: check duplicates only. Do not make server-side requests to arbitrary submitted URLs because of the security risk.

### 2. Improve the discovery filter modal

Make the existing filter modal the main place for refining project discovery. Do not add a permanent filter bar to the homepage.

To do:

- [ ] Confirm the API supports category, island, availability, pricing, and project stage together.
- [ ] Add the missing controls to the existing modal.
- [ ] Keep selected filters synchronized with the URL so results can be shared.
- [ ] Show active-filter count, clear-all, loading, empty, and error states.
- [ ] Verify the layout and keyboard behavior on mobile and desktop.
- [ ] Add tests for applying, combining, clearing, and restoring filters from the URL.

Done when: visitors can combine all approved filters, share the resulting URL, and reset the search without leaving the discovery view.

### 3. Improve the mobile map experience

Make the map the primary mobile experience, using the available screen for exploring locations and projects. The current half-screen panels take too much space away from the map.

To do:

- [ ] Let the map fill the available mobile viewport, accounting for browser controls and device safe areas.
- [ ] Replace the persistent half-screen content with a compact, collapsed preview that users can expand on demand.
- [ ] Keep search, filters, and map controls compact and reachable without covering important map content.
- [ ] Show a small project preview when a marker is selected, with an explicit action to open full details.
- [ ] Make expanded panels easy to collapse or dismiss and preserve the map position, zoom, and selected marker when returning.
- [ ] Verify panning, pinch-to-zoom, marker selection, and panel gestures work together without accidental scrolling or blocked interactions.
- [ ] Check small phones and landscape orientation so controls, previews, and the on-screen keyboard leave the map usable.

Done when: mobile visitors can explore the map using most of the screen by default, select projects, and return from details without losing their place.

Decision: prioritize the map. A half-screen panel must not be the default mobile layout; expanded content appears only when requested.

### 4. Existing-user project collaboration

Allow a project owner to add existing Hub Digital users as collaborators, record what each person contributed, and credit them on the project and profile pages. The owner keeps full control of the project.

To do:

- [ ] Define the project-collaborator data model, role labels, uniqueness rules, and owner permissions.
- [ ] Add owner-only API endpoints to search users and add, update, or remove collaborators.
- [ ] Add an **Add collaborator** action near the submission review block and open the search flow in a modal.
- [ ] Let the owner select or enter a contribution role such as programmer, designer, co-founder, or marketer.
- [ ] Show a **Makers** section above the comments on the project page, with each person's avatar, profile link, and contribution role.
- [ ] Separate **Owned projects** and **Collaborations** on maker profiles.
- [ ] Add authorization, duplicate-collaborator, API, and UI tests.

Done when: an owner can credit an existing user, visitors can see that credit on the project page, and the collaborator can see the project separately on their profile.

Decision: the first version supports existing platform users only. Email invitations for people without accounts remain deferred until transactional email exists.

### 5. Smaller frontend modules while delivering P0 work

Improve maintainability in the submission, project-detail, gallery, and profile areas touched by the P0 features.

To do:

- [ ] Identify components that mix data access, state management, and large UI sections.
- [ ] Extract focused components and hooks when a P0 change touches those files.
- [ ] Keep route components and feature entry points thin.
- [ ] Add or preserve tests before changing behavior-heavy modules.
- [ ] Remove dead code and duplicated option mappings discovered during the work.

Done when: each P0 feature lands without making the largest modules more complex, and the affected behavior remains covered by tests.

Decision: refactor incrementally alongside product work. Do not pause the launch backlog for an open-ended rewrite of the whole frontend.

## P1 — Next before launch

### Project requests

Let makers state whether they want feedback, testers, contributors, customers, partners, or investment.

To do:

- [ ] Define the allowed request types and storage model.
- [ ] Add a quiet multi-select control to submission and editing.
- [ ] Display requests below the comments section.
- [ ] Make request types available to discovery after the first version is validated.

### Looking for collaborators

Let makers specify whether they are looking for developers, designers, marketers, or co-founders.

To do:

- [ ] Decide whether this is a focused project-request type or a separate field; avoid two overlapping systems.
- [ ] Add the selected roles during submission and editing.
- [ ] Show a compact **Looking for collaborators** tag on project cards and project details.
- [ ] Make the tag discoverable through the filter modal.

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
