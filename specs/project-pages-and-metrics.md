# Project information, previews and destination metrics

Milestone 5 delivery (October 2026), following the accepted submission audit and supplied Product Hunt screenshots. Reuses HubDigital components, colors and tokens.

## Information and public display

- Optional languages: up to ten distinct, readable language names, with shortcuts for Portuguese, Cabo Verdean Creole, English and French. Custom languages remain possible; builders are not forced into a short enum.
- Optional team description (500 characters), help categories and help description (500 characters). These are independent of customer model, maturity and availability. Team prose is not verified maker membership; accepted public credits belong to milestone 6.
- Preview/public detail reuse `ProjectProfile` and `ProjectGeography`, and omit unanswered information. Moderation displays supplied optional information too.
- Identity fields have counters and their actual 120/200-character limits. Optional copy remains concise, retaining the requested Monetização / Modelo de negócio / Código-fonte layout.
- Category quick search plus a full browsing dialog/mobile sheet. Selection is staged; Cancel restores the saved selection, Apply commits it. The first choice is primary, with up to two additional choices. Primary changes and removal work in both views; keyboard controls and focus return are supported.
- Logo selection shows the same `ProjectSummary` component used in discovery, with real name/description and no simulated votes. Gallery ordering remains the ordered key array; the first image is labelled Imagem de capa. Public social metadata uses that first image, falling back to logo. YouTube remains the only video provider; demos remain typed destinations.
- Open-source selection offers an optional repository shortcut without inventing a second URL field or making a repository compulsory.

## Clicks and attribution

`project_link_clicks` stores daily counts by destination ID and surface (`detail`, `card`, `map`). It contains no visitor identity, IP, destination query string or personal click history. Counts are raw attempted clicks, including repeats; they are not unique people, confirmed landings or signups.

Normal public actions keep direct, validated destinations and report a best-effort keepalive POST to `/v1/projects/links/:linkId/click`. Analytics failure never blocks navigation. Preview does not report clicks. `/v1/projects/go/:linkId` also supports stored HTTP(S) redirects, a bounded best-effort metric attempt, no-store responses and prefetch filtering. It never accepts an arbitrary redirect target. Email remains a direct action rather than a redirect.

Known bots and the publishing owner are excluded; hidden/deleted/draft projects and hidden publishers are not counted or redirected. Per-link reports are restricted to the owning publisher at `/v1/projects/:id/link-stats`, with 7/30/90-day windows and zero-count destinations. The owner dashboard shows a breakdown for a selected project and calls the aggregate Cliques de saída. Changing a destination URL retains its logical link ID and history: the breakdown is per link, not a versioned external URL. Deleted destinations lose their destination-level breakdown through FK cascade; project-level historical totals remain.

Referral attribution is unchecked by default and explicitly opt-in per link. Only plain website destinations without query parameters receive `utm_source=hubdigital` and `utm_medium=referral`. Paths and fragments survive. Existing queries—including signed URLs—store links, repository links and contacts are preserved. The exact resulting destination is shown to the builder.

Page-view session markers are set only after successful ingestion, allowing retry after a failed request. Session counts remain an estimate; neither the UI nor the API claims server-side unique visitors. Accepted maker credits do not grant ownership, editing or private metric access.

Migration: `0024_project_profiles_and_clicks`. No compatibility adapter or new external messaging/analytics service. Promo codes, promotional offers, trials and Loom are deferred.

## Verification

All 198 checks for milestone 5 were verified across the full run (197 passed) and a corrected two-test destination rerun. One expectation originally confused the 403 response for a user without a publisher profile with the 404 response for a publisher asking for another owner’s metrics; both cases are now asserted. Later full roadmap verification is recorded in the roadmap.

Browser checks confirmed category Cancel/Apply and primary changes, optional language/team/help fields through owner edits and public display, referral URL preview and matching public action, a recorded anonymous click and the private owner breakdown. Editing at 390 px had no horizontal overflow. Social title metadata was verified. Builds and changed-file ESLint passed; final roadmap verification records subsequent changes.

Live R2 uploading was not reverified here; existing storage tests mock the object store. No remote image importing or new media provider was added.
