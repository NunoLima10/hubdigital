# Announcements, creator credit and reviewed edits

Milestone 6 delivery. Permanent project pages remain separate from community announcements. No promo offers, email invitations or scheduling UI.

## Directory and announcements

Publishing a ready project creates its directory page (or queues that page for review); it does not automatically claim a first release or enter a weekly window. Default discovery includes all published projects. The owner’s **Comunidade** action separately creates an **Apresentação**, **Primeira versão** or **Atualização importante**, with a 10–1000-character introduction and an idempotency key.

`project_announcements` has its own publication/review state and `published_at`; the ranking week is derived from `published_at` (Cabo Verde time), not stored. `scheduled_for` is added when scheduling is built. `announcement_votes` keeps independent account votes; supporting a project is separate from supporting an announcement. The weekly feed ranks globally by announcement votes before pagination and supports loading more. Project detail shows supplied announcements; it omits an empty announcement section.

The existing review-required/trusted-publisher policy applies. Pending announcements have no assigned week and remain private. Approval assigns the current ISO week in Atlantic/Cape_Verde, so moderation delay does not silently consume an earlier window. One published announcement per project per week is enforced transactionally; at most one pending announcement is allowed. A first-release uniqueness constraint prevents another active first release for the same project. Unavailable projects can be introduced with Apresentação; first-release announcements require available, public-beta or invitation-only access; waitlists use Apresentação. This is checked both on submission and approval.

Project weekly/monthly filters use announcement history, rather than the latest stamp, so a later update does not erase an earlier week. These project listings retain project support totals; the announcement feed uses separate announcement votes. `projects.launched_at` is a denormalized latest announcement stamp, never an original availability date. Project publication and edit approval do not reset the page’s publication date.

## Creator credit and consent

`project_makers` separates the publishing owner from creator credit. Publishing does not automatically claim authorship. Owners can explicitly add themselves or invite an existing public profile by handle. Invitations become public credits only after the invited account accepts; another account cannot accept on their behalf. Declining removes the pending invitation. No email is sent.

Private invitations appear in the recipient’s dashboard even when they have no projects. Accepted participation appears on project detail and the maker profile, without duplicating a project owned and created by the same person. Public responses omit pending invitations and private email addresses. Hidden makers/projects are excluded, including invitations to a hidden owner’s project. Acceptance requires the project to remain public; recipients can still decline an obsolete invitation. Creator credit is consent to attribution, not a platform verification of their work or an ownership/editor/analytics permission grant.

Account identities are included in private and owner-dependent browser query keys.

## Material edits and moderation

When review is required and the publisher does not qualify for trusted auto-approval, changing identity/description/team prose or the set of destinations creates a `project_revisions` proposal. Ordinary optional metadata changes remain immediate. Empty optional prose is normalized so an untouched blank field does not accidentally require review. Destination comparison is conservative; changes may require review even for a small correction.

The approved project, links, categories and media stay public. Proposed content is validated with the same publication rules, sanitization, category checks and completed owned media checks. The owner can resume pending or rejected content in editing, and sees pending state or rejection feedback. Everyone else receives only the approved record.

Pending proposals are immutable versions. Replacing one retires the old version and creates a new ID; a moderator’s old review cannot silently approve replacement content. A content row-version counter prevents approval after another live edit, without relying on clock precision. Project-row locking comes before revision-row locking to avoid deadlocks with owner updates. Approval applies the complete proposal and decision atomically; rejection leaves the public page unchanged. Staff can reject obsolete proposals after a project is withdrawn without reopening its page.

Staff use **Anúncios e alterações** in the admin app to compare the current page with a full proposed preview, or review the announcement introduction. Rejection requires a reason. Actions and audit records commit together; project audit metadata identifies the announcement/revision entity and ID.

Migrations: `0025_community_and_revisions` and `0026_project_revision_versions`. Development data is retained; no runtime compatibility layer.

## Boundaries

Scheduling, emailing invitations, ownership transfer/dispute workflows and collaborator editing permissions are later decisions. Invitations do not prevent project publication. Existing-profile handles are needed for public attribution; a person without a profile can create one before being invited. Changes to an already public announcement are not supported in this first delivery; failed-request replay returns the original record, and the UI preserves and identifies an unsent changed message.

## Verification

API coverage includes separate directory publication, idempotent announcement creation, independent voting, weekly limits, delayed moderation crossing a week, invitation consent and ownership, accepted projects on profiles, public visibility, live approved pages while edits wait, approval, rejected feedback, replaced and stale revisions, and harmless empty-field corrections.

Browser checks confirmed a pending announcement approved through the admin UI and then shown in the weekly feed; a material edit kept its approved page public until admin approval; an invited creator stayed private, accepted through an empty-project dashboard and became visible on the project and profile. Public community pages at 390 px had no horizontal overflow. The development review setting was restored after the workflow. Final suite/build counts and temporary-data cleanup are recorded in the roadmap.

Admin startup needed a correction to the existing Vite plugin order: the router plugin precedes React transformation, following [TanStack’s installation guidance](https://tanstack.com/router/latest/docs/installation/with-vite). The generated route tree includes the new staff page.
