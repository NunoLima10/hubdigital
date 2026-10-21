import { SettingsService } from "@/modules/settings/settings-services";
import { projectRevisions } from "@/db/schemas";
import { DB } from "@/db";
import {
  comments,
  projectFavorites,
  projectImages,
  projects,
  projectUpvotes,
  publishers,
  users,
} from "@/db/schemas";
import { ConflictError } from "@/utils/custom-errors";
import { sanitizeProjectDescription } from "@/utils/project-content";
import { serializeProjectLinks, syncProjectLinks } from "@/utils/project-links";
import {
  assertProjectCategories,
  syncSecondaryCategories,
  serializeProjectCategories,
  secondaryCategoriesWith,
  projectCategoryFilter,
} from "@/utils/project-categories";
import { assertProjectMedia } from "@/utils/project-media";
import { assertProjectReady } from "@/utils/project-publication";
import { errorLogger } from "@/utils/error-logger";
import { LocationColumns, locationToColumns, withLocation } from "@/utils/location";
import { toPublicUrl } from "@/utils/public-url";
import { slugify } from "@/utils/slugify";
import { LaunchRange } from "@/utils/week";
import {
  getYoutubeVideoId,
  ListSort,
  type DraftProjectLocation,
  type ProjectDraft,
} from "@hubdigital/shared";
import {
  SQL,
  and,
  asc,
  arrayOverlaps,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";

// Only the ids are needed to produce a count. Neither a deleted comment nor one
// hidden by staff belongs in a number shown on a card.
const liveCommentIds = {
  columns: { id: true },
  where: and(isNull(comments.deletedAt), isNull(comments.hiddenAt)),
} as const;

type CreateProjectInput = ProjectDraft & {
  publisherId: number;
  userId: string;
  creationKey?: string;
};

type UpdateProjectInput = Partial<Omit<CreateProjectInput, "publisherId">>;

/** The API takes a nested location; the table stores it flat. */
function toRowValues<
  T extends {
    location?: DraftProjectLocation | null;
    galleryImageKeys?: string[];
    youtubeVideoUrl?: string | null;
    userId?: string;
    links?: ProjectDraft["links"];
    description?: string;
    teamDescription?: string | null;
    helpDescription?: string | null;
    secondaryCategoryIds?: number[];
  },
>({
  location,
  galleryImageKeys: _galleryImageKeys,
  youtubeVideoUrl,
  userId: _userId,
  links: _links,
  secondaryCategoryIds: _secondaryCategoryIds,
  ...input
}: T) {
  const sanitizedDescription = sanitizeProjectDescription(input.description);
  const description = sanitizedDescription?.replace(/<[^>]*>/g, "").trim()
    ? sanitizedDescription
    : null;
  return {
    ...input,
    ...(input.teamDescription !== undefined
      ? { teamDescription: input.teamDescription?.trim() || null }
      : {}),
    ...(input.helpDescription !== undefined
      ? { helpDescription: input.helpDescription?.trim() || null }
      : {}),
    ...(input.description !== undefined ? { description } : {}),
    ...(youtubeVideoUrl !== undefined
      ? {
          youtubeVideoUrl,
          youtubeVideoId: youtubeVideoUrl ? getYoutubeVideoId(youtubeVideoUrl) : null,
        }
      : {}),
    ...(location !== undefined ? locationToColumns(location) : {}),
  };
}

type SerializableProject = LocationColumns & {
  upvotes: { userId: string }[];
  comments: { id: number }[];
  logoUrl?: string | null;
  images: { storageKey: string }[];
  secondaryMemberships: {
    position: number;
    category: import("@hubdigital/shared").CategorySummary;
  }[];
  links: (typeof import("@/db/schemas").projectLinks.$inferSelect)[];
};

/**
 * Collapses the upvote rows into a count plus the current user's state, and
 * turns the stored R2 keys into public URLs. Everything the API hands out goes
 * through here so the two never drift apart.
 */
function serializeProject<T extends SerializableProject>(project: T, userId?: string) {
  const { upvotes, comments: projectComments, secondaryMemberships, ...rest } = project;

  return {
    ...withLocation(rest),
    ...serializeProjectCategories(secondaryMemberships),
    links: serializeProjectLinks(project.links),
    description:
      "description" in project
        ? sanitizeProjectDescription(project.description as string | null)
        : undefined,
    logoUrl: toPublicUrl(project.logoUrl),
    galleryImageKeys: project.images.map((image) => image.storageKey),
    galleryImageUrls: project.images.map((image) => toPublicUrl(image.storageKey)),
    upvoteCount: upvotes.length,
    hasUpvoted: userId ? upvotes.some((upvote) => upvote.userId === userId) : false,
    commentCount: projectComments.length,
  };
}

type ModerationSource = {
  status?: string;
  rejectionReason?: string | null;
  shadowBannedAt?: string | null;
  shadowBanReason?: string | null;
};

/**
 * The half of the moderation state a maker is allowed to see about their own
 * work. A hide is deliberately not silent — the maker is told it happened and
 * why (specs/ADMIN.md §A4) — but only ever to the maker, never to a visitor.
 *
 * An account-level hide is reported the same way on each of that maker's
 * projects, since from their side the effect is identical.
 */
function ownerModerationFields(
  project: ModerationSource,
  owner?: { shadowBannedAt?: Date | string | null; shadowBanReason?: string | null } | null,
) {
  const accountHiddenAt = owner?.shadowBannedAt
    ? new Date(owner.shadowBannedAt).toISOString()
    : null;

  const hiddenAt = project.shadowBannedAt ?? accountHiddenAt;

  return {
    rejectionReason: project.rejectionReason ?? null,
    hidden: Boolean(hiddenAt),
    hiddenAt,
    hiddenReason: project.shadowBannedAt
      ? (project.shadowBanReason ?? null)
      : (owner?.shadowBanReason ?? null),
  };
}

async function findPublisherByUserId(db: DB, userId: string) {
  return db.query.publishers.findFirst({
    where: eq(publishers.userId, userId),
  });
}

async function createProject(db: DB, input: CreateProjectInput) {
  const base = slugify(input.name) || "projeto";
  await assertProjectMedia(db, input.userId, input);

  return db.transaction(async (tx) => {
    await assertProjectCategories(tx, input.categoryId, input.secondaryCategoryIds);
    const row = toRowValues(input);
    let [result] = await tx
      .insert(projects)
      .values({ ...row, slug: base })
      .onConflictDoNothing()
      .returning({ id: projects.id, slug: projects.slug });

    if (!result) {
      if (input.creationKey) {
        const existing = await tx.query.projects.findFirst({
          where: and(
            eq(projects.publisherId, input.publisherId),
            eq(projects.creationKey, input.creationKey),
          ),
          columns: { id: true, slug: true, deletedAt: true },
        });
        if (existing) {
          if (existing.deletedAt)
            throw new ConflictError("Este rascunho foi removido. Começa um novo projeto.");
          return { id: existing.id, slug: existing.slug };
        }
      }
      [result] = await tx
        .insert(projects)
        .values({ ...row, slug: `${base}-${randomUUID().slice(0, 6)}` })
        .returning({ id: projects.id, slug: projects.slug });
    }

    await syncProjectLinks(tx, result.id, input.links);
    await syncSecondaryCategories(tx, result.id, input.secondaryCategoryIds);
    if (input.galleryImageKeys.length > 0) {
      await tx.insert(projectImages).values(
        input.galleryImageKeys.map((storageKey, position) => ({
          projectId: result.id,
          storageKey,
          position,
        })),
      );
    }

    return result;
  });
}

async function updateProject(
  db: DB,
  id: number,
  publisherId: number,
  input: UpdateProjectInput,
  { bypassReview = false }: { bypassReview?: boolean } = {},
) {
  await assertProjectMedia(db, input.userId!, input);

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from projects where id = ${id} and publisher_id = ${publisherId} for update`,
    );
    const existing = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.publisherId, publisherId),
        isNull(projects.deletedAt),
      ),
      with: {
        images: true,
        links: true,
        secondaryMemberships: secondaryCategoriesWith,
        publisher: { columns: { userId: true } },
      },
    });
    if (!existing) return undefined;
    const secondaryIds =
      input.secondaryCategoryIds ??
      existing.secondaryMemberships.map((membership) => membership.categoryId);
    await assertProjectCategories(
      tx,
      input.categoryId === undefined ? existing.categoryId : input.categoryId,
      secondaryIds,
    );
    const nextValues = toRowValues(input);
    const material =
      ["name", "shortDescription", "description", "teamDescription"].some(
        (key) =>
          key in nextValues &&
          (nextValues as Record<string, unknown>)[key] !==
            (existing as Record<string, unknown>)[key],
      ) ||
      (input.links !== undefined &&
        JSON.stringify(input.links.map((link) => ({ kind: link.kind, url: link.url }))) !==
          JSON.stringify(
            serializeProjectLinks(existing.links).map((link) => ({
              kind: link.kind,
              url: link.url,
            })),
          ));
    const settings = bypassReview ? null : await SettingsService.getSettings(db);
    const publisher = await tx.query.publishers.findFirst({
      where: eq(publishers.id, publisherId),
      columns: { trustedAt: true },
    });
    const requiresReview =
      !bypassReview &&
      settings?.["moderation.review_required"] &&
      !(settings["moderation.auto_approve_trusted"] && publisher?.trustedAt);
    if (existing.status === "published" && material && requiresReview) {
      const body = assertProjectReady({
        ...existing,
        ...nextValues,
        secondaryCategoryIds: secondaryIds,
        links: input.links ?? serializeProjectLinks(existing.links),
        images: input.galleryImageKeys?.map((storageKey) => ({ storageKey })) ?? existing.images,
      });
      await assertProjectMedia(
        tx,
        input.userId!,
        { logoUrl: body.logoUrl, galleryImageKeys: body.galleryImageKeys },
        true,
      );
      const pending = await tx.query.projectRevisions.findFirst({
        where: and(eq(projectRevisions.projectId, id), eq(projectRevisions.status, "pending")),
      });
      const revision = {
        body,
        baseUpdatedAt: existing.updatedAt,
        baseVersion: existing.rowVersion,
        createdAt: new Date().toISOString(),
      };
      if (pending)
        await tx
          .update(projectRevisions)
          .set({ status: "rejected", reason: "Substituída pelo autor" })
          .where(eq(projectRevisions.id, pending.id));
      await tx.insert(projectRevisions).values({ ...revision, projectId: id });
      return { id, slug: existing.slug, pendingReview: true };
    }
    if (existing.status === "published" || existing.status === "pending") {
      assertProjectReady({
        ...existing,
        ...Object.fromEntries(
          Object.entries(nextValues).filter(([, value]) => value !== undefined),
        ),
        secondaryCategoryIds: secondaryIds,
        links: input.links ?? serializeProjectLinks(existing.links),
        images:
          input.galleryImageKeys !== undefined
            ? input.galleryImageKeys.map((storageKey) => ({ storageKey }))
            : existing.images,
      });
    }
    const [result] = await tx
      .update(projects)
      .set({
        ...nextValues,
        rowVersion: sql`${projects.rowVersion} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(projects.id, id), eq(projects.publisherId, publisherId), isNull(projects.deletedAt)),
      )
      .returning({ id: projects.id, slug: projects.slug });

    if (!result) return undefined;

    if (input.secondaryCategoryIds !== undefined)
      await syncSecondaryCategories(tx, id, secondaryIds);
    if (input.links !== undefined) await syncProjectLinks(tx, id, input.links);
    if (existing.status === "published" || existing.status === "pending") {
      await assertProjectMedia(
        tx,
        input.userId!,
        {
          logoUrl: input.logoUrl === undefined ? existing.logoUrl : input.logoUrl,
          galleryImageKeys:
            input.galleryImageKeys ?? existing.images.map((image) => image.storageKey),
        },
        true,
      );
    }
    if (input.galleryImageKeys !== undefined) {
      await tx.delete(projectImages).where(eq(projectImages.projectId, id));
      if (input.galleryImageKeys.length > 0) {
        await tx.insert(projectImages).values(
          input.galleryImageKeys.map((storageKey, position) => ({
            projectId: id,
            storageKey,
            position,
          })),
        );
      }
    }

    return result;
  });
}

async function latestEditReview(
  db: DB,
  project: Pick<typeof projects.$inferSelect, "id" | "rowVersion">,
) {
  const review = await db.query.projectRevisions.findFirst({
    where: eq(projectRevisions.projectId, project.id),
    orderBy: desc(projectRevisions.createdAt),
  });
  return !review || (review.status === "rejected" && review.baseVersion !== project.rowVersion)
    ? null
    : review;
}

/** Drafts included — this is the maker's own dashboard. Deleted rows are not. */
async function listMyProjects(
  db: DB,
  publisherId: number,
  { limit, offset }: { limit: number; offset: number },
  userId?: string,
) {
  const where = and(eq(projects.publisherId, publisherId), isNull(projects.deletedAt));

  const [data, [{ total }]] = await Promise.all([
    db.query.projects.findMany({
      where,
      with: {
        category: true,
        secondaryMemberships: secondaryCategoriesWith,
        upvotes: true,
        comments: liveCommentIds,
        images: { orderBy: asc(projectImages.position) },
        links: true,
        // Needed only to report an account-level hide back to its owner.
        publisher: { with: { user: true } },
      },
      orderBy: desc(projects.createdAt),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(projects).where(where),
  ]);

  return {
    data: await Promise.all(
      data.map(async ({ publisher, ...project }) => ({
        ...serializeProject(project, userId),
        ...ownerModerationFields(project, publisher?.user),
        editReview: await latestEditReview(db, project),
      })),
    ),
    total,
  };
}

export type ProjectFilters = {
  /** Free text matched against the name and the short description. */
  q?: string;
  categoryId?: number;
  country?: string;
  island?: (typeof projects.$inferSelect)["island"];
  pricing?: (typeof projects.$inferSelect)["pricing"];
  projectStage?: (typeof projects.$inferSelect)["projectStage"];
  platform?: (typeof projects.$inferSelect)["platform"];
};

/** Everything a visitor is allowed to see, narrowed by the caller's filters. */
function publicProjectFilter(week?: LaunchRange | null, filters: ProjectFilters = {}) {
  const conditions: (SQL | undefined)[] = [
    eq(projects.status, "published"),
    isNull(projects.deletedAt),
    // Hidden by staff (specs/ADMIN.md §A4). Its own upvote rows are left alone,
    // so unhiding restores the project with its count intact.
    isNull(projects.shadowBannedAt),
    // A hidden maker takes their projects with them. Written as a correlated
    // NOT EXISTS so this stays a pure predicate with no database handle.
    //
    // The subquery uses its own aliases and literal column names on purpose:
    // the relational query builder rewrites every interpolated column to the
    // root table it is aliasing, so `${users.id}` inside here would come out as
    // `projects.user_id`. Only the correlating reference to `projects` is
    // interpolated, because that one does belong to the root.
    sql`not exists (
      select 1
      from ${publishers} as p
      inner join ${users} as u on u.id = p.user_id
      where p.id = ${projects.publisherId}
        and u.shadow_banned_at is not null
    )`,
  ];

  if (week) {
    conditions.push(
      sql`exists (select 1 from project_announcements a where a.project_id=${projects.id} and a.status='published' and a.published_at>=${week.start.toISOString()}::timestamptz and a.published_at<${week.end.toISOString()}::timestamptz)`,
    );
  }

  if (filters.country)
    conditions.push(
      or(
        eq(projects.country, filters.country),
        sql`exists (select 1 from jsonb_array_elements(${projects.additionalLocations}) as loc where loc->>'country' = ${filters.country})`,
      ),
    );
  if (filters.q) {
    // ILIKE is enough at launch volume; swap in a tsvector column with a GIN
    // index when the catalogue outgrows a sequential scan.
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(projects.name, pattern), ilike(projects.shortDescription, pattern)));
  }

  if (filters.categoryId) {
    conditions.push(projectCategoryFilter(filters.categoryId));
  }
  if (filters.island) {
    conditions.push(
      or(
        eq(projects.island, filters.island),
        sql`exists (select 1 from jsonb_array_elements(${projects.additionalLocations}) as loc where loc->>'island' = ${filters.island})`,
      ),
    );
  }
  if (filters.pricing) {
    conditions.push(eq(projects.pricing, filters.pricing));
  }
  if (filters.projectStage) {
    conditions.push(eq(projects.projectStage, filters.projectStage));
  }
  if (filters.platform?.length) {
    // platform is an array column, so match projects supporting any of them.
    conditions.push(arrayOverlaps(projects.platform, filters.platform));
  }

  return and(...conditions);
}

type ListProjectsOptions = ProjectFilters & {
  limit: number;
  offset: number;
  sort: ListSort;
  /** Restricts the listing to a launch period; null lists every launch. */
  week?: LaunchRange | null;
};

async function listProjects(
  db: DB,
  { limit, offset, sort, week, ...filters }: ListProjectsOptions,
  userId?: string,
) {
  const where = publicProjectFilter(week, filters);

  const [{ total }] = await db.select({ total: count() }).from(projects).where(where);

  // Ranking by vote count is done in memory rather than in SQL. A weekly window
  // holds at most a handful of launches, and the upvote rows are already loaded
  // to compute `hasUpvoted`, so a correlated subquery would buy nothing. Revisit
  // if `period=all` ever has to rank thousands of rows.
  if (sort === "upvotes") {
    const all = await db.query.projects.findMany({
      where,
      with: {
        category: true,
        secondaryMemberships: secondaryCategoriesWith,
        upvotes: true,
        comments: liveCommentIds,
        images: { orderBy: asc(projectImages.position) },
        links: true,
      },
    });

    const ranked = all
      .map((project) => serializeProject(project, userId))
      .sort(
        (a, b) =>
          b.upvoteCount - a.upvoteCount ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return { data: ranked.slice(offset, offset + limit), total };
  }

  const data = await db.query.projects.findMany({
    where,
    with: {
      category: true,
      secondaryMemberships: secondaryCategoriesWith,
      upvotes: true,
      comments: liveCommentIds,
      images: { orderBy: asc(projectImages.position) },
      links: true,
    },
    orderBy: [desc(projects.publishedAt), desc(projects.createdAt)],
    limit,
    offset,
  });

  return { data: data.map((project) => serializeProject(project, userId)), total };
}

async function listMapProjects(
  db: DB,
  { limit, offset, ...filters }: ProjectFilters & { limit: number; offset: number },
) {
  const where = publicProjectFilter(null, filters);
  return db.transaction(
    async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(projects).where(where);
      const rows = await tx
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          shortDescription: projects.shortDescription,
          logoUrl: projects.logoUrl,
          country: projects.country,
          island: projects.island,
          municipality: projects.municipality,
          zone: projects.zone,
          locationDetails: projects.locationDetails,
          additionalLocations: projects.additionalLocations,
          teamMode: projects.teamMode,
        })
        .from(projects)
        .where(where)
        .orderBy(asc(projects.id))
        .limit(limit)
        .offset(offset);
      return {
        data: rows.map((row) => ({ ...withLocation(row), logoUrl: toPublicUrl(row.logoUrl) })),
        meta: { total, limit, offset },
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

async function listFavoriteProjects(
  db: DB,
  userId: string,
  { limit, offset }: { limit: number; offset: number },
) {
  const saved = await db.query.projectFavorites.findMany({
    where: eq(projectFavorites.userId, userId),
    columns: { projectId: true },
    orderBy: desc(projectFavorites.createdAt),
  });
  const projectIds = saved.map((favorite) => favorite.projectId);

  if (projectIds.length === 0) return { data: [], total: 0 };

  const visible = await db.query.projects.findMany({
    where: and(inArray(projects.id, projectIds), publicProjectFilter(null, {})),
    with: {
      category: true,
      secondaryMemberships: secondaryCategoriesWith,
      upvotes: true,
      comments: liveCommentIds,
      images: { orderBy: asc(projectImages.position) },
      links: true,
    },
  });
  const byId = new Map(visible.map((project) => [project.id, project]));
  const ordered = projectIds
    .map((id) => byId.get(id))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  return {
    data: ordered.slice(offset, offset + limit).map((project) => serializeProject(project, userId)),
    total: ordered.length,
  };
}

async function getProjectBySlug(db: DB, slug: string, userId?: string) {
  const result = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      category: true,
      secondaryMemberships: secondaryCategoriesWith,
      publisher: { with: { user: true } },
      upvotes: true,
      comments: liveCommentIds,
      images: { orderBy: asc(projectImages.position) },
      links: true,
    },
  });

  if (!result) return null;

  const { publisher, ...project } = result;

  // A draft is visible only to the maker who owns it, so they can preview a
  // project before putting it in front of anyone else. Deleted rows are gone
  // for everybody.
  const isOwner = Boolean(userId && publisher?.user?.id === userId);

  // Hidden by staff, or belonging to a hidden maker: the owner still sees it —
  // and is told why below — while for everyone else it is a 404. A visitor must
  // not be able to tell a hidden project from one that never existed.
  const hiddenAt = project.shadowBannedAt ?? publisher?.user?.shadowBannedAt ?? null;

  const isVisible =
    !project.deletedAt && (project.status === "published" || isOwner) && (!hiddenAt || isOwner);

  if (!isVisible) return null;

  return {
    ...serializeProject(project, userId),
    ...(isOwner
      ? {
          ...ownerModerationFields(project, publisher?.user),
          editReview: await latestEditReview(db, project),
        }
      : {}),
    author: publisher?.user
      ? {
          id: publisher.user.id,
          name: publisher.user.name,
          image: publisher.user.image,
          handle: publisher.handle,
        }
      : null,
  };
}

/**
 * Moves a draft into the current weekly cycle, or into the review queue when
 * the gate is on. Publishing is idempotent: calling it on a live project
 * returns it unchanged rather than resetting its launch date, which would
 * otherwise let a maker jump into a fresh ranking window.
 *
 * The caller decides whether review applies — it depends on a platform setting
 * and on whether this publisher is trusted, neither of which belongs in a
 * query.
 */
async function publishProject(
  db: DB,
  id: number,
  publisherId: number,
  { requireReview = false }: { requireReview?: boolean } = {},
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from projects where id = ${id} and publisher_id = ${publisherId} for update`,
    );
    const existing = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.publisherId, publisherId),
        isNull(projects.deletedAt),
      ),
      with: {
        images: true,
        links: true,
        secondaryMemberships: secondaryCategoriesWith,
        publisher: { columns: { userId: true } },
      },
    });

    if (!existing) return null;
    // Already live, or already waiting on a moderator: nothing to do either way.
    if (existing.status === "published" || existing.status === "pending") {
      return { id: existing.id, slug: existing.slug, status: existing.status };
    }

    await assertProjectCategories(
      tx,
      existing.categoryId,
      existing.secondaryMemberships.map((membership) => membership.categoryId),
    );
    assertProjectReady({
      ...existing,
      secondaryCategoryIds: existing.secondaryMemberships.map(
        (membership) => membership.categoryId,
      ),
      links: serializeProjectLinks(existing.links),
    });
    await assertProjectMedia(
      tx,
      existing.publisher.userId,
      {
        logoUrl: existing.logoUrl,
        galleryImageKeys: existing.images.map((image) => image.storageKey),
      },
      true,
    );

    const now = new Date().toISOString();

    const [result] = await tx
      .update(projects)
      .set(
        requireReview
          ? {
              status: "pending",
              queuedAt: now,
              // A resubmission starts clean; the previous rejection has been
              // answered by the edit that led here.
              rejectionReason: null,
              updatedAt: now,
            }
          : {
              status: "published",
              publishedAt: existing.publishedAt ?? now,
              launchedAt: existing.launchedAt,
              updatedAt: now,
            },
      )
      .where(and(eq(projects.id, id), eq(projects.publisherId, publisherId)))
      .returning({
        id: projects.id,
        slug: projects.slug,
        status: projects.status,
      });

    return result;
  });
}

/**
 * Soft delete: the row stays so upvote history and slugs are not silently
 * reused, but it disappears from every listing.
 */
async function deleteProject(db: DB, id: number, publisherId: number) {
  const now = new Date().toISOString();

  const [result] = await db
    .update(projects)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(eq(projects.id, id), eq(projects.publisherId, publisherId), isNull(projects.deletedAt)),
    )
    .returning({ id: projects.id });

  return result;
}

type UpvoteContext = {
  ipAddress?: string;
  userAgent?: string;
};

async function toggleUpvote(
  db: DB,
  projectId: number,
  userId: string,
  context: UpvoteContext = {},
) {
  // Only a live project can be voted on: no stuffing votes into a draft before
  // it launches, and no voting on something that has been removed.
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.status, "published"),
      isNull(projects.deletedAt),
    ),
    columns: { id: true },
  });

  if (!project) return null;

  const existing = await db.query.projectUpvotes.findFirst({
    where: and(eq(projectUpvotes.projectId, projectId), eq(projectUpvotes.userId, userId)),
  });

  if (existing) {
    await db.delete(projectUpvotes).where(eq(projectUpvotes.id, existing.id));
  } else {
    await db.insert(projectUpvotes).values({
      projectId,
      userId,
      ipAddress: context.ipAddress?.slice(0, 64),
      userAgent: context.userAgent,
    });
  }

  const [{ upvoteCount }] = await db
    .select({ upvoteCount: count() })
    .from(projectUpvotes)
    .where(eq(projectUpvotes.projectId, projectId));

  return { upvoted: !existing, upvoteCount };
}

async function toggleFavorite(db: DB, projectId: number, userId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), publicProjectFilter(null, {})),
    columns: { id: true },
  });

  if (!project) return null;

  const existing = await db.query.projectFavorites.findFirst({
    where: and(eq(projectFavorites.projectId, projectId), eq(projectFavorites.userId, userId)),
    columns: { id: true },
  });

  if (existing) {
    await db.delete(projectFavorites).where(eq(projectFavorites.id, existing.id));
    return { favorited: false };
  }

  await db.insert(projectFavorites).values({ projectId, userId });
  return { favorited: true };
}

export const ProjectsService = {
  listMapProjects,
  findPublisherByUserId: errorLogger(
    findPublisherByUserId,
    "projectsService.findPublisherByUserId",
  ),
  createProject: errorLogger(createProject, "projectsService.createProject"),
  updateProject: errorLogger(updateProject, "projectsService.updateProject"),
  publishProject: errorLogger(publishProject, "projectsService.publishProject"),
  deleteProject: errorLogger(deleteProject, "projectsService.deleteProject"),
  listMyProjects: errorLogger(listMyProjects, "projectsService.listMyProjects"),
  listProjects: errorLogger(listProjects, "projectsService.listProjects"),
  listFavoriteProjects: errorLogger(listFavoriteProjects, "projectsService.listFavoriteProjects"),
  getProjectBySlug: errorLogger(getProjectBySlug, "projectsService.getProjectBySlug"),
  toggleUpvote: errorLogger(toggleUpvote, "projectsService.toggleUpvote"),
  toggleFavorite: errorLogger(toggleFavorite, "projectsService.toggleFavorite"),
};
