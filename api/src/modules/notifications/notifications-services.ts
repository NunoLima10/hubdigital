import { config } from "@/config";
import { DB } from "@/db";
import {
  comments,
  projects,
  users,
  weeklyRankingResults,
} from "@/db/schemas";
import { discord, DiscordEmbed, truncate } from "@/lib/discord";
import { logger } from "@/utils/logger";
import { toPublicUrl } from "@/utils/public-url";
import {
  ModerationAction,
  ModerationTarget,
  projectBadgeCatalog,
  ProjectBadgeKey,
  ReportReason,
  reportReasonLabels,
  ReportTarget,
} from "@hubdigital/shared";
import { and, asc, eq, lte } from "drizzle-orm";

/**
 * What the platform tells its Discord channels (see src/lib/discord.ts).
 *
 * Every function here is called after the change it describes is committed,
 * returns at once and never throws: the lookups and the post happen in the
 * background, so a slow or broken Discord can't touch the request.
 */

const COLORS = {
  error: 0xdc3e42,
  moderation: 0x6f6e77,
  edit: 0x12a594,
  ranking: 0xffc53d,
  milestone: 0xf76b15,
  badge: 0xab4aba,
  signup: 0x8e4ec6,
  report: 0xe5484d,
  comment: 0x3e63dd,
  pending: 0xf5a524,
  published: 0x30a46c,
} as const;

const webUrl = (path: string) => `${config.WEB_URL.replace(/\/+$/, "")}${path}`;
const adminUrl = (path: string) =>
  `${config.ADMIN_URL.replace(/\/+$/, "")}${path}`;

/** Discord only renders absolute image URLs. */
function absoluteImage(key: string | null | undefined) {
  const url = toPublicUrl(key);
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : webUrl(url);
}

function absoluteThumb(key: string | null | undefined) {
  const url = absoluteImage(key);
  return url ? { url } : undefined;
}

function inBackground(name: string, task: () => Promise<void>) {
  task().catch((error) => {
    logger.warn({ err: error, notification: name }, "Notification skipped");
  });
}

const targetLabels: Record<ReportTarget, string> = {
  project: "Projeto",
  comment: "Comentário",
  user: "Utilizador",
};

async function describeReportTarget(
  db: DB,
  targetType: ReportTarget,
  targetId: string,
) {
  if (targetType === "project") {
    const row = await db.query.projects.findFirst({
      where: eq(projects.id, Number(targetId)),
      columns: { id: true, name: true },
    });
    return row ? `[${row.name}](${adminUrl(`/projects/${row.id}`)})` : null;
  }

  if (targetType === "comment") {
    const row = await db.query.comments.findFirst({
      where: eq(comments.id, Number(targetId)),
      columns: { body: true, projectId: true },
    });
    return row
      ? `[Ver comentário](${adminUrl(`/comments?projectId=${row.projectId}`)})\n> ${truncate(row.body.replace(/\n+/g, " "), 300)}`
      : null;
  }

  const row = await db.query.users.findFirst({
    where: eq(users.id, targetId),
    columns: { id: true, name: true },
  });
  return row ? `[${row.name}](${adminUrl(`/users/${row.id}`)})` : null;
}

function reportCreated(
  db: DB,
  input: {
    reporterId: string;
    targetType: ReportTarget;
    targetId: string;
    reason: ReportReason;
    details?: string;
  },
) {
  if (!discord.enabled("activity")) return;

  inBackground("report.created", async () => {
    const [reporter, target] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, input.reporterId),
        columns: { name: true },
      }),
      describeReportTarget(db, input.targetType, input.targetId),
    ]);

    const fields: DiscordEmbed["fields"] = [
      { name: "Motivo", value: reportReasonLabels[input.reason], inline: true },
      { name: "Tipo", value: targetLabels[input.targetType], inline: true },
      { name: "Alvo", value: target ?? `#${input.targetId}` },
    ];
    if (input.details) {
      fields.push({ name: "Detalhes", value: truncate(input.details, 1000) });
    }

    discord.send("activity", {
      embeds: [
        {
          title: "🚩 Nova denúncia",
          url: adminUrl("/reports"),
          color: COLORS.report,
          author: reporter ? { name: reporter.name } : undefined,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

function commentCreated(
  db: DB,
  input: { commentId: number; projectId: number; isReply: boolean },
) {
  if (!discord.enabled("activity")) return;

  inBackground("comment.created", async () => {
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, input.commentId),
      columns: { body: true },
      with: {
        user: { columns: { name: true, image: true } },
        project: { columns: { name: true, slug: true } },
      },
    });
    if (!comment) return;

    discord.send("activity", {
      embeds: [
        {
          title: `💬 ${input.isReply ? "Nova resposta" : "Novo comentário"} em ${comment.project.name}`,
          url: webUrl(`/projects/${comment.project.slug}`),
          description: truncate(comment.body, 2000),
          color: COLORS.comment,
          author: {
            name: comment.user.name,
            icon_url: comment.user.image ?? undefined,
          },
          fields: [
            {
              name: "Moderar",
              value: `[Abrir no admin](${adminUrl(`/comments?projectId=${input.projectId}`)})`,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

async function loadProject(db: DB, projectId: number) {
  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      logoKey: true,
      status: true,
      deletedAt: true,
      shadowBannedAt: true,
    },
    with: {
      category: { columns: { name: true } },
      publisher: {
        columns: { id: true },
        with: {
          user: { columns: { name: true, image: true, shadowBannedAt: true } },
        },
      },
    },
  });
}

type ProjectEvent = "submitted" | "published" | "approved";

/**
 * A project sent for review only reaches staff. One that goes live — straight
 * away or on approval — reaches staff and the public channel, unless the
 * project or its maker is hidden: the public channel shows only what the
 * site shows.
 */
function projectStatusChanged(
  db: DB,
  input: { projectId: number; event: ProjectEvent; reviewerId?: string },
) {
  const goesPublic = input.event !== "submitted";
  if (
    !discord.enabled("activity") &&
    !(goesPublic && discord.enabled("public"))
  ) {
    return;
  }

  inBackground(`project.${input.event}`, async () => {
    const [project, reviewer] = await Promise.all([
      loadProject(db, input.projectId),
      input.reviewerId
        ? db.query.users.findFirst({
            where: eq(users.id, input.reviewerId),
            columns: { name: true },
          })
        : undefined,
    ]);
    if (!project) return;

    const maker = project.publisher.user;
    const publicUrl = webUrl(`/projects/${project.slug}`);
    const logo = absoluteImage(project.logoKey);

    const titles: Record<ProjectEvent, string> = {
      submitted: `🕓 Projeto enviado para revisão: ${project.name}`,
      published: `🚀 Projeto publicado: ${project.name}`,
      approved: `✅ Projeto aprovado: ${project.name}`,
    };

    const fields: DiscordEmbed["fields"] = [
      { name: "Maker", value: maker.name, inline: true },
    ];
    if (project.category) {
      fields.push({
        name: "Categoria",
        value: project.category.name,
        inline: true,
      });
    }
    if (reviewer) {
      fields.push({ name: "Revisto por", value: reviewer.name, inline: true });
    }
    fields.push({
      name: "Links",
      value:
        input.event === "submitted"
          ? `[Fila de revisão](${adminUrl("/queue")}) · [Projeto no admin](${adminUrl(`/projects/${project.id}`)})`
          : `[Ver no site](${publicUrl}) · [Projeto no admin](${adminUrl(`/projects/${project.id}`)})`,
    });

    discord.send("activity", {
      embeds: [
        {
          title: titles[input.event],
          url: adminUrl(`/projects/${project.id}`),
          description: project.shortDescription
            ? truncate(project.shortDescription, 500)
            : undefined,
          color:
            input.event === "submitted" ? COLORS.pending : COLORS.published,
          thumbnail: logo ? { url: logo } : undefined,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    if (!goesPublic || project.shadowBannedAt || maker.shadowBannedAt) return;

    discord.send("public", {
      embeds: [
        {
          title: `🚀 ${project.name}`,
          url: publicUrl,
          description: project.shortDescription
            ? truncate(project.shortDescription, 500)
            : undefined,
          color: COLORS.published,
          author: { name: maker.name, icon_url: maker.image ?? undefined },
          thumbnail: logo ? { url: logo } : undefined,
          fields: project.category
            ? [{ name: "Categoria", value: project.category.name, inline: true }]
            : undefined,
          footer: { text: "Novo no hubdigital.cv" },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

/** The activity channel is staff only, so the email can go there. */
function userSignedUp(user: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}) {
  if (!discord.enabled("activity")) return;

  discord.send("activity", {
    embeds: [
      {
        title: "👋 Novo utilizador na plataforma",
        url: adminUrl(`/users/${user.id}`),
        color: COLORS.signup,
        author: { name: user.name, icon_url: user.image ?? undefined },
        fields: [
          { name: "Nome", value: truncate(user.name, 256), inline: true },
          { name: "Email", value: user.email, inline: true },
        ],
        thumbnail: user.image ? { url: user.image } : undefined,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/* ------------------------------------------------------------- server errors */

const ERROR_COOLDOWN_MS = 5 * 60 * 1000;
const recentErrors = new Map<string, number>();

/**
 * A 5xx the API answered. The same error on the same route is sent at most
 * once per five minutes, so an outage is one message, not thousands. Only the
 * route pattern goes out, never the full URL: query strings can carry tokens.
 */
function serverError(input: {
  method: string;
  route: string;
  status: number;
  requestId: string;
  error: Error;
}) {
  if (!discord.enabled("activity")) return;

  const key = `${input.method} ${input.route} ${input.error.message}`;
  const now = Date.now();
  const last = recentErrors.get(key);
  if (last && now - last < ERROR_COOLDOWN_MS) return;
  recentErrors.set(key, now);
  if (recentErrors.size > 500) {
    for (const [entry, at] of recentErrors) {
      if (now - at >= ERROR_COOLDOWN_MS) recentErrors.delete(entry);
    }
  }

  const stack = input.error.stack?.split("\n").slice(0, 8).join("\n");
  const fence = "```";

  discord.send("activity", {
    embeds: [
      {
        title: `🔥 Erro ${input.status} em ${input.method} ${truncate(input.route, 200)}`,
        description: stack
          ? `${fence}\n${truncate(stack, 1800)}\n${fence}`
          : truncate(input.error.message || "Sem mensagem", 2000),
        color: COLORS.error,
        fields: [
          { name: "Ambiente", value: config.NODE_ENV, inline: true },
          { name: "Request id", value: input.requestId, inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/* --------------------------------------------------- edits to live projects */

/**
 * A maker changed a project that is live: either the change is already on the
 * site (`live`), or it waits in the edit review queue (`review`).
 */
function publishedProjectEdited(
  db: DB,
  input: { projectId: number; outcome: "live" | "review"; fields: string[] },
) {
  if (!discord.enabled("activity")) return;

  inBackground("project.edited", async () => {
    const project = await loadProject(db, input.projectId);
    if (!project) return;

    const live = input.outcome === "live";
    const adminLink = `[Projeto no admin](${adminUrl(`/projects/${project.id}`)})`;

    discord.send("activity", {
      embeds: [
        {
          title: live
            ? `✏️ Projeto publicado editado: ${project.name}`
            : `✏️ Edição à espera de revisão: ${project.name}`,
          url: adminUrl(`/projects/${project.id}`),
          color: live ? COLORS.edit : COLORS.pending,
          thumbnail: absoluteThumb(project.logoKey),
          fields: [
            { name: "Maker", value: project.publisher.user.name, inline: true },
            {
              name: "Campos alterados",
              value: input.fields.length ? input.fields.join(", ") : "—",
              inline: true,
            },
            {
              name: "Links",
              value: live
                ? `[Ver no site](${webUrl(`/projects/${project.slug}`)}) · ${adminLink}`
                : `[Revisões pendentes](${adminUrl("/community-review")}) · ${adminLink}`,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

/* ------------------------------------------------------- moderation actions */

const actionLabels: Partial<Record<ModerationAction, string>> = {
  "project.reject": "❌ Rejeitou o projeto",
  "project.unpublish": "⏬ Despublicou o projeto",
  "project.restore": "♻️ Restaurou o projeto",
  "project.shadow_ban": "🙈 Ocultou o projeto",
  "project.unshadow_ban": "👁️ Reexpôs o projeto",
  "project.edit_published": "✏️ Editou um projeto publicado",
  "user.shadow_ban": "🙈 Ocultou a conta",
  "user.unshadow_ban": "👁️ Reexpôs a conta",
  "comment.hide": "🙈 Ocultou o comentário",
  "comment.unhide": "👁️ Reexpôs o comentário",
  "comment.delete": "🗑️ Removeu o comentário",
  "publisher.trust": "🤝 Marcou como maker de confiança",
  "publisher.untrust": "↩️ Retirou a marca de confiança",
  "setting.update": "⚙️ Alterou definições",
  "report.resolve": "✔️ Resolveu denúncias",
  "category.create": "🏷️ Criou uma categoria",
  "category.update": "🏷️ Alterou uma categoria",
  "user.badge_grant": "🎖️ Atribuiu um distintivo",
  "user.badge_revoke": "🎖️ Removeu um distintivo",
  "project.badge_grant": "🏆 Atribuiu uma conquista",
  "project.badge_revoke": "🏆 Removeu uma conquista",
};

function moderationTargetLink(targetType: ModerationTarget, targetId: string) {
  switch (targetType) {
    case "project":
      return `[Projeto #${targetId}](${adminUrl(`/projects/${targetId}`)})`;
    case "user":
      return `[Conta](${adminUrl(`/users/${targetId}`)})`;
    case "comment":
      return `Comentário #${targetId}`;
    case "report":
      return `[Denúncias](${adminUrl("/reports")})`;
    case "setting":
      return `[Definições](${adminUrl("/settings")})`;
    default:
      return `${targetType} #${targetId}`;
  }
}

/**
 * Every audited staff action, so moderators see what the others did. Approval
 * has its own, richer message (projectStatusChanged), so it is left out here.
 */
function moderationAction(
  db: DB,
  actor: { id: string; email?: string | null },
  entry: {
    action: ModerationAction;
    targetType: ModerationTarget;
    targetId: string | number;
    reason?: string | null;
  },
) {
  const label = actionLabels[entry.action];
  if (!label || !discord.enabled("activity")) return;

  inBackground(`moderation.${entry.action}`, async () => {
    const who = await db.query.users.findFirst({
      where: eq(users.id, actor.id),
      columns: { name: true },
    });

    const fields: DiscordEmbed["fields"] = [
      {
        name: "Alvo",
        value: moderationTargetLink(entry.targetType, String(entry.targetId)),
        inline: true,
      },
    ];
    if (entry.reason) {
      fields.push({ name: "Motivo", value: truncate(entry.reason, 1000) });
    }

    discord.send("activity", {
      embeds: [
        {
          title: label,
          color: COLORS.moderation,
          author: { name: who?.name ?? actor.email ?? "Staff" },
          fields,
          footer: { text: entry.action },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

/* ---------------------------------------------------------- public channel */

/** The project, if the site shows it: not deleted, live, nobody hidden. */
async function loadPublicProject(db: DB, projectId: number) {
  const project = await loadProject(db, projectId);
  if (
    !project ||
    project.status !== "published" ||
    project.deletedAt ||
    project.shadowBannedAt ||
    project.publisher.user.shadowBannedAt
  ) {
    return null;
  }
  return project;
}

const medals = ["🥇", "🥈", "🥉"];

/** The top three of a week that has just closed. */
function weeklyRankingClosed(db: DB, weekId: string) {
  if (!discord.enabled("public")) return;

  inBackground("ranking.weekly", async () => {
    const top = await db
      .select({
        projectId: weeklyRankingResults.projectId,
        rank: weeklyRankingResults.rank,
        upvotes: weeklyRankingResults.upvotes,
      })
      .from(weeklyRankingResults)
      .where(
        and(
          eq(weeklyRankingResults.weekId, weekId),
          lte(weeklyRankingResults.rank, 3),
        ),
      )
      .orderBy(asc(weeklyRankingResults.rank));

    // A week nobody voted in has nothing to celebrate.
    const ranked = top.filter((row) => row.upvotes > 0);
    if (ranked.length === 0) return;

    const loaded = await Promise.all(
      ranked.map((row) => loadPublicProject(db, row.projectId)),
    );

    const lines = ranked.flatMap((row, index) => {
      const project = loaded[index];
      if (!project) return [];
      const medal = medals[row.rank - 1] ?? `${row.rank}.`;
      return [
        `${medal} **[${project.name}](${webUrl(`/projects/${project.slug}`)})** · ${row.upvotes} apoios · por ${project.publisher.user.name}`,
      ];
    });
    if (lines.length === 0) return;

    const winner = loaded[0];
    const weekLabel = weekId.replace(/^(\d{4})-W(\d+)$/, "$2 de $1");

    discord.send("public", {
      embeds: [
        {
          title: `🏆 Ranking da semana ${weekLabel}`,
          url: webUrl("/ranking"),
          description: lines.join("\n"),
          color: COLORS.ranking,
          thumbnail: winner ? absoluteThumb(winner.logoKey) : undefined,
          footer: { text: "hubdigital.cv" },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

/** A project reached an upvote milestone; only the highest one reached is told. */
function upvoteMilestoneReached(
  db: DB,
  input: { projectId: number; keys: ProjectBadgeKey[] },
) {
  if (!discord.enabled("public") || input.keys.length === 0) return;

  inBackground("project.milestone", async () => {
    const project = await loadPublicProject(db, input.projectId);
    if (!project) return;

    const top = [...input.keys].sort(
      (a, b) =>
        projectBadgeCatalog[a].sortOrder - projectBadgeCatalog[b].sortOrder,
    )[0];

    discord.send("public", {
      embeds: [
        {
          title: `🎉 ${project.name} chegou aos ${projectBadgeCatalog[top].name}!`,
          url: webUrl(`/projects/${project.slug}`),
          description: project.shortDescription
            ? truncate(project.shortDescription, 300)
            : undefined,
          color: COLORS.milestone,
          author: {
            name: project.publisher.user.name,
            icon_url: project.publisher.user.image ?? undefined,
          },
          thumbnail: absoluteThumb(project.logoKey),
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

/** Staff handed a project an achievement (staff pick, project of the month). */
function projectBadgeGranted(
  db: DB,
  input: { projectId: number; key: ProjectBadgeKey; period: string | null },
) {
  if (!discord.enabled("public")) return;

  inBackground("project.badge", async () => {
    const project = await loadPublicProject(db, input.projectId);
    if (!project) return;

    const badge = projectBadgeCatalog[input.key];
    discord.send("public", {
      embeds: [
        {
          title: `🏅 ${badge.name}: ${project.name}`,
          url: webUrl(`/projects/${project.slug}`),
          description: badge.description,
          color: COLORS.badge,
          author: {
            name: project.publisher.user.name,
            icon_url: project.publisher.user.image ?? undefined,
          },
          thumbnail: absoluteThumb(project.logoKey),
          fields: input.period
            ? [{ name: "Período", value: input.period, inline: true }]
            : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  });
}

export const NotificationsService = {
  serverError,
  publishedProjectEdited,
  moderationAction,
  weeklyRankingClosed,
  upvoteMilestoneReached,
  projectBadgeGranted,
  userSignedUp,
  reportCreated,
  commentCreated,
  projectStatusChanged,
};
