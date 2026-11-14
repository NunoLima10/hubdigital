/** What a moderation action or a report points at. */
export const moderationTargetValues = [
  "project",
  "user",
  "comment",
  "publisher",
  "setting",
  "report",
] as const;

export type ModerationTarget = (typeof moderationTargetValues)[number];

/**
 * Every auditable action, named `<target>.<verb>`. Kept as a closed list so the
 * audit filter can offer a select rather than a free-text box, and so a typo in
 * a call site is a type error instead of an unfindable log row.
 */
export const moderationActionValues = [
  "project.approve",
  "project.reject",
  "project.unpublish",
  "project.restore",
  "project.shadow_ban",
  "project.unshadow_ban",
  "project.edit_published",
  "user.shadow_ban",
  "user.unshadow_ban",
  "comment.hide",
  "comment.unhide",
  "comment.delete",
  "publisher.trust",
  "publisher.untrust",
  "setting.update",
  "report.resolve",
  "category.create",
  "category.update",
] as const;

export type ModerationAction = (typeof moderationActionValues)[number];

export const reportReasonValues = [
  "spam",
  "offensive",
  "misleading",
  "not_cabo_verde",
  "broken_link",
  "other",
] as const;

export type ReportReason = (typeof reportReasonValues)[number];

export const reportReasonLabels: Record<ReportReason, string> = {
  spam: "Spam ou publicidade",
  offensive: "Conteúdo ofensivo",
  misleading: "Informação enganosa",
  not_cabo_verde: "Não tem ligação a Cabo Verde",
  broken_link: "Link partido ou projeto inexistente",
  other: "Outro motivo",
};

export const reportStatusValues = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type ReportStatus = (typeof reportStatusValues)[number];

/** Only `project`, `comment` and `user` can be reported by a visitor. */
export const reportTargetValues = ["project", "comment", "user"] as const;

export type ReportTarget = (typeof reportTargetValues)[number];

/**
 * A written reason is mandatory on every sanction, and this is the floor for
 * it. Short enough not to be a chore, long enough that "spam" alone doesn't
 * pass — the maker is shown this text.
 */
export const MODERATION_REASON_MIN = 10;
export const MODERATION_REASON_MAX = 1000;

/** Ceiling on one bulk moderation request. */
export const MODERATION_BULK_MAX = 100;
