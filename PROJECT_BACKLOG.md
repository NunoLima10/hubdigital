# Hub Digital — Product improvements

This document reflects the reviewed product decisions. Delete a feature to remove it from the plan. Add implementation guidance after `Comment:`.

## Completed — first high-priority pass

### Weekly launches first

Make projects launched this week the primary homepage feed. Recent projects remain available as a secondary section.

Comment: Implemented. Weekly launches now appear first when the week has projects.

### Hide empty announcements

Remove the homepage announcement block when the current week has no announcements.

Comment: Implemented. The section disappears after a successful empty response.

### Better project media presentation

Keep screenshots and logos inside a balanced gallery so one asset cannot dominate the project page.

Comment: Implemented. Gallery images now use a contained 16:9 presentation.

### Error and not-found pages

Add route-level error handling and useful pages for missing projects and unknown URLs.

Comment: Implemented. Existing global pages were retained, project 404 handling was added, and public project failures now offer retry.

### Correct file and folder names

Correct misspelled names such as `sumbmit-form` and `hearder` without changing behavior.

Comment: Implemented, including provider/context symbols and `isFirst`.

### Easier local development setup

Add environment examples, correct outdated README information, and provide one reliable command for starting the local database, API, and website.

Comment: Implemented with `pnpm dev`, `pnpm dev:apps`, API/web environment examples, and corrected documentation.

### Stable API development mode on Windows

Stop the API watcher from restarting because dependencies inside `node_modules` changed.

Comment: Implemented with explicit `tsx watch` exclusions for local and workspace `node_modules`. Verified on a second local API port without restart loops.

### Cache invalidation rules

Centralize query keys and document which project, comment, vote, ranking, profile, and dashboard queries refresh after each mutation.

Comment: Implemented for the principal project, comment, vote, announcement, maker, map, metrics, and dashboard mutation paths.

## Completed — second high-priority pass

### Helpful empty and error states

Give people a clear next action when content is empty, unavailable, offline, or fails to load.

Comment: Implemented across public project lists and pages, favorites, project management, metrics, preferences, comments, and map filters. Empty states now point to a useful next action, and failed requests offer retry where recovery is possible.

### Consistent Portuguese interface language

Review the principal navigation, actions, submission flow, empty states, and errors so the same terms are used consistently.

Comment: Implemented across the main navigation, account, submission, dashboard, empty states, and errors. The interface now consistently uses `Painel`, `Área de trabalho`, `palavra-passe`, `Site`, and `Tentar novamente`.

## Before launch

### Improve the discovery filter modal

Improve the existing filter modal with category, island, availability, pricing, and project stage. Do not add a permanent filter bar to the homepage.

Comment: Keep all extra discovery controls inside the modal.

### Curated collections

Create useful collections such as Made in Santiago, Open source, Student projects, and Looking for collaborators.

Comment: Interesting feature. Explore a focused first version.

### Project activity information

Show when a project was last updated and whether it appears actively maintained.

Comment: Place this in the project sidebar.

### Ranking history

Show the current weekly position and rank movement over time.

Comment: Give this strong emphasis near the top of the project sidebar.

### Better related projects

Recommend projects using category, platform, audience, stage, and location instead of category alone.

Comment: Approved.

### Project requests

Let makers state whether they want feedback, testers, contributors, customers, partners, or investment.

Comment: Approved. Keep it visually quiet and place it below the comments section.

### Submission quality score

Show quality guidance throughout submission and provide a simple score from 1 to 10 to help makers improve completeness.

Comment: Approved. The score should guide quality, not block saving a draft.

### Duplicate-link validation

Detect links already used by another project before publication.

Comment: Check duplicates only for now. Do not make server-side requests to arbitrary URLs because of security risk.

### Existing-user project collaboration

During the review step, allow the owner to search for an existing Hub Digital user and add them as a project collaborator. The owner keeps full control. Record the collaborator's role, such as programmer, designer, co-founder, or marketer. Show owned projects and collaborations separately on profiles.

Comment: Important before launch. Start with existing platform users only. Email invitations for people without accounts come later, after transactional email is enabled. Use an “Add collaborator” action close to the review block and open the search flow in a modal.

### Looking for collaborators

Let makers indicate that they are looking for developers, designers, marketers, or co-founders and make this discoverable.

Comment:

### Community awards

Create awards that can belong to both projects and makers and feature important awards in a dedicated place.

Comment: Strongly desired. Design the award and badge model carefully before implementation.

### Lightweight accessibility review

Fix obvious keyboard, focus, contrast, heading, label, and form-error problems.

Comment: Keep the first pass simple. A deeper audit can happen after launch.

### Error monitoring

Record client errors and API failures so production problems can be investigated.

Comment: Approved.

## After launch

### Complete footer

Add About, Community guidelines, Privacy, GitHub, Contact, and Submit a project links.

Comment: Requires deeper content and information-architecture analysis.

### Project updates and changelogs

Let makers publish structured progress updates and release notes.

Comment: Valuable but large. Revisit after launch.

### Maker and organization verification

Add verification for authentic makers and organizations.

Comment: Revisit after launch.

### Sticky submission buttons

Keep Back, Save draft, and Next visible during long submission steps.

Comment: Low priority. Try later.

### Better moderation feedback

Explain why a project needs changes and what the maker should update.

Comment: Revisit after launch.

### Follow projects and makers

Allow people to follow projects and makers.

Comment: Revisit after launch.

### Notifications

Notify people about replies, votes, moderation decisions, followed projects, and project updates.

Comment: Revisit after launch.

### Weekly email digest

Send an optional summary of launches, discussions, and project updates.

Comment: Revisit after launch.

### Pinned maker comment

Let a maker pin an important explanation or update in the comments.

Comment: Revisit after launch.

### Invite collaborators by email

Allow owners to invite collaborators who do not yet have a Hub Digital account.

Comment: Build only after transactional email is enabled. The recipient should receive an invitation linked to the project.

### Image optimization

Resize oversized uploads, generate thumbnails, and serve efficient formats.

Comment: Later.

### Product analytics with PostHog

Measure the journey from discovery to project view, destination visit, signup, and publication.

Comment: Important after launch. Use PostHog.

### Frontend browser tests

Cover sign-in, submission, publication, voting, commenting, and moderation in a real browser.

Comment: Later.

### More frontend component tests

Increase coverage for important components, routes, forms, and interactive states.

Comment:

### Smaller frontend modules

Split the largest submission and project-detail modules into smaller units with clearer responsibilities.

Comment: Later.

## Product decisions

### Keep project metadata in the sidebar

Do not move all metadata into the project introduction. The sidebar remains the main place for project details, activity, and ranking information.

### Projects are submitted by their owners

Do not build a “Claim this project” workflow. Hub Digital expects people to publish projects they own or co-own.

### No additional field examples for now

Do not add more examples for taglines, descriptions, or screenshots in the current submission flow.
