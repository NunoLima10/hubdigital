import { SettingsService } from "@/modules/settings/settings-services";
import { projectRevisions } from "@/db/schemas";
import { DB } from "@/db";
import {
  projectFavorites,
  projectImages,
  projects,
  projectUpvotes,
  publishers,
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
import {
  assertUniqueProjectLinks,
  lockProjectDestinations,
} from "@/utils/project-duplicates";
import { errorLogger } from "@/utils/error-logger";
import {
  LocationColumns,
  locationToColumns,
  withLocation,
} from "@/utils/location";
import {
  projectEngagementExtras,
  publicProjectConditions,
  upvoteCountSql,
} from "@/utils/project-visibility";
import { toPublicUrl } from "@/utils/public-url";
import { slugify } from "@/utils/slugify";
import { currentWeek, LaunchRange } from "@/utils/week";
import { ProjectBadgesService } from "@/modules/project-badges/project-badges-services";
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
  ne,
  or,
  sql,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";

/** The relations a project card needs; the counts come from `extras`. */
const cardRelations = {
  category: true,
  secondaryMemberships: secondaryCategoriesWith,
  images: { orderBy: asc(projectImages.position) },
  links: true,
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
    ...(youtubeVideoUrl !== undefined ? { youtubeVideoUrl } : {}),
    ...(location !== undefined ? locationToColumns(location) : {}),
  };
}

type SerializableProject = LocationColumns & {
  upvoteCount: number;
  hasUpvoted: boolean;
  commentCount: number;
  logoKey?: string | null;
  youtubeVideoUrl?: string | null;
  images: { storageKey: string }[];
  secondaryMemberships: {
    position: number;
    category: import("@hubdigital/shared").CategorySummary;
  }[];
  links: (typeof import("@/db/schemas").projectLinks.$inferSelect)[];
};

/**
 * Turns the stored R2 keys into public URLs and rebuilds the derived fields.
 * Everything the API hands out goes through here so the two never drift apart.
 * The counts come from `projectEngagementExtras` in the same query.
 */
function serializeProject<T extends SerializableProject>(project: T) {
  const { secondaryMemberships, ...rest } = project;

  return {
    ...withLocation(rest),
    ...serializeProjectCategories(secondaryMemberships),
    links: serializeProjectLinks(project.links),
    description:
      "description" in project
        ? sanitizeProjectDescription(project.description as string | null)
        : undefined,
    logoUrl: toPublicUrl(project.logoKey),
    youtubeVideoId: project.youtubeVideoUrl
      ? getYoutubeVideoId(project.youtubeVideoUrl)
      : null,
    galleryImageKeys: project.images.map((image) => image.storageKey),
    galleryImageUrls: project.images.map((image) =>
      toPublicUrl(image.storageKey),
    ),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Current weekly place and the change from the same time one day earlier. */
async function weeklyRankForProject(
  db: DB,
  projectId: number,
  launchedAt: string | null,
) {
  const now = new Date();
  const week = currentWeek(now);
  const launched = launchedAt ? new Date(launchedAt) : null;
  if (!launched || launched < week.start || launched >= week.end) return null;

  // Spelled out: a single-table select renders projects.id as a bare "id",
  // which inside the subqueries below would bind to the inner table's own id
  // and count every project as one vote.
  const projectIdRef = sql.raw(`"projects"."id"`);

  async function rankingAt(cutoff: Date) {
    const voteCount = sql<number>`(
      select count(*)::int
      from project_upvotes pu
      where pu.project_id = ${projectIdRef}
        and pu.created_at <= ${cutoff.toISOString()}::timestamptz
    )`;
    return db
      .select({ id: projects.id, votes: voteCount })
      .from(projects)
      .where(
        and(
          publicProjectConditions,
          sql`exists (
            select 1 from project_announcements a
            where a.project_id = ${projectIdRef}
              and a.status = 'published'
              and a.published_at >= ${week.start.toISOString()}::timestamptz
              and a.published_at < ${week.end.toISOString()}::timestamptz
              and a.published_at <= ${cutoff.toISOString()}::timestamptz
          )`,
        ),
      )
      .orderBy(desc(voteCount), desc(projects.createdAt), desc(projects.id));
  }

  const previousCutoff = new Date(now.getTime() - DAY_MS);
  const [current, previous] = await Promise.all([
    rankingAt(now),
    previousCutoff >= week.start
      ? rankingAt(previousCutoff)
      : Promise.resolve([]),
  ]);
  const currentIndex = current.findIndex((item) => item.id === projectId);
  if (currentIndex < 0) return null;

  const previousIndex = previous.findIndex((item) => item.id === projectId);
  const rank = currentIndex + 1;
  return {
    rank,
    total: current.length,
    movement: previousIndex < 0 ? null : previousIndex + 1 - rank,
    week: week.weekId,
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
  owner?: {
    shadowBannedAt?: Date | string | null;
    shadowBanReason?: string | null;
  } | null,
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
    await assertProjectCategories(
      tx,
      input.categoryId,
      input.secondaryCategoryIds,
    );
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
            throw new ConflictError(
              "Este rascunho foi removido. Começa um novo projeto.",
            );
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
  // Read process-wide settings before reserving a transaction connection.
  // Querying through the outer database handle while a transaction holds the
  // destination advisory lock can starve a single-connection pool and leave
  // every later request (including categories and health checks) queued.
  const settings = bypassReview
    ? null
    : await SettingsService.getSettings(db);

  return db.transaction(async (tx) => {
    await lockProjectDestinations(tx);
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
    if (existing.status === "published" || existing.status === "pending")
      await assertUniqueProjectLinks(
        tx,
        id,
        input.links ?? serializeProjectLinks(existing.links),
      );
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
        JSON.stringify(
          input.links.map((link) => ({ kind: link.kind, url: link.url })),
        ) !==
          JSON.stringify(
            serializeProjectLinks(existing.links).map((link) => ({
              kind: link.kind,
              url: link.url,
            })),
          ));
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
        images:
          input.galleryImageKeys?.map((storageKey) => ({ storageKey })) ??
          existing.images,
      });
      await assertProjectMedia(
        tx,
        input.userId!,
        { logoKey: body.logoKey, galleryImageKeys: body.galleryImageKeys },
        true,
      );
      const pending = await tx.query.projectRevisions.findFirst({
        where: and(
          eq(projectRevisions.projectId, id),
          eq(projectRevisions.status, "pending"),
        ),
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
      .set({ ...nextValues, rowVersion: sql`${projects.rowVersion} + 1` })
      .where(
        and(
          eq(projects.id, id),
          eq(projects.publisherId, publisherId),
          isNull(projects.deletedAt),
        ),
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
          logoKey:
            input.logoKey === undefined ? existing.logoKey : input.logoKey,
          galleryImageKeys:
            input.galleryImageKeys ??
            existing.images.map((image) => image.storageKey),
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

type EditReviewTarget = Pick<typeof projects.$inferSelect, "id" | "rowVersion">;

/**
 * The newest edit review of each project, in one query. A rejection the maker
 * has since edited past is no longer worth showing.
 */
async function latestEditReviews(db: DB, targets: EditReviewTarget[]) {
  const reviews = new Map<
    number,
    typeof projectRevisions.$inferSelect | null
  >();
  if (targets.length === 0) return reviews;

  const latest = await db
    .selectDistinctOn([projectRevisions.projectId])
    .from(projectRevisions)
    .where(
      inArray(
        projectRevisions.projectId,
        targets.map((target) => target.id),
      ),
    )
    .orderBy(projectRevisions.projectId, desc(projectRevisions.createdAt));
  const byProject = new Map(latest.map((review) => [review.projectId, review]));

  for (const target of targets) {
    const review = byProject.get(target.id);
    reviews.set(
      target.id,
      !review ||
        (review.status === "rejected" &&
          review.baseVersion !== target.rowVersion)
        ? null
        : review,
    );
  }
  return reviews;
}

async function latestEditReview(db: DB, project: EditReviewTarget) {
  return (await latestEditReviews(db, [project])).get(project.id) ?? null;
}

/** Drafts included — this is the maker's own dashboard. Deleted rows are not. */
async function listMyProjects(
  db: DB,
  publisherId: number,
  { limit, offset }: { limit: number; offset: number },
  userId?: string,
) {
  const where = and(
    eq(projects.publisherId, publisherId),
    isNull(projects.deletedAt),
  );

  const [data, [{ total }]] = await Promise.all([
    db.query.projects.findMany({
      where,
      with: {
        ...cardRelations,
        // Needed only to report an account-level hide back to its owner.
        publisher: {
          columns: {},
          with: {
            user: { columns: { shadowBannedAt: true, shadowBanReason: true } },
          },
        },
      },
      extras: projectEngagementExtras(userId),
      orderBy: desc(projects.createdAt),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(projects).where(where),
  ]);

  const reviews = await latestEditReviews(db, data);

  return {
    data: data.map(({ publisher, ...project }) => ({
      ...serializeProject(project),
      ...ownerModerationFields(project, publisher?.user),
      editReview: reviews.get(project.id) ?? null,
    })),
    total,
  };
}

export type PeriodMatch = "launch" | "published";

export type ProjectFilters = {
  /** Free text matched against the name and the short description. */
  q?: string;
  categoryId?: number;
  country?: string;
  island?: (typeof projects.$inferSelect)["island"];
  pricing?: (typeof projects.$inferSelect)["pricing"];
  availability?: (typeof projects.$inferSelect)["availability"];
  helpWanted?: import("@hubdigital/shared").Project["helpWanted"][number];
  projectStage?: (typeof projects.$inferSelect)["projectStage"];
  platform?: (typeof projects.$inferSelect)["platform"];
  /** Rank by similarity to this project instead of by recency or votes alone. */
  relatedTo?: number;
};

/** Everything a visitor is allowed to see, narrowed by the caller's filters. */
function publicProjectFilter(
  week?: LaunchRange | null,
  filters: ProjectFilters = {},
  periodMatch: PeriodMatch = "launch",
) {
  // A hidden project keeps its own upvote rows, so unhiding restores it with
  // its count intact.
  const conditions: (SQL | undefined)[] = [publicProjectConditions];

  if (week) {
    const start = week.start.toISOString();
    const end = week.end.toISOString();
    const announced = sql`exists (select 1 from project_announcements a where a.project_id=${projects.id} and a.status='published' and a.published_at>=${start}::timestamptz and a.published_at<${end}::timestamptz)`;
    // The ranking only counts announced launches; discovery search also lists
    // a project published in the range that has not been announced yet.
    conditions.push(
      periodMatch === "published"
        ? or(
            and(
              gte(projects.publishedAt, sql`${start}::timestamptz`),
              lt(projects.publishedAt, sql`${end}::timestamptz`),
            ),
            announced,
          )
        : announced,
    );
  }

  // Further bases are matched with `@>`, which the GIN index on
  // additional_locations can answer.
  if (filters.country)
    conditions.push(
      or(
        eq(projects.country, filters.country),
        sql`${projects.additionalLocations} @> ${JSON.stringify([{ country: filters.country }])}::jsonb`,
      ),
    );
  if (filters.q) {
    // Trigram GIN indexes on both columns make the leading-wildcard ILIKE
    // indexable. Wildcards typed by the visitor are matched literally.
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(projects.name, pattern),
        ilike(projects.shortDescription, pattern),
      ),
    );
  }

  if (filters.categoryId) {
    conditions.push(projectCategoryFilter(filters.categoryId));
  }
  if (filters.island) {
    conditions.push(
      or(
        eq(projects.island, filters.island),
        sql`${projects.additionalLocations} @> ${JSON.stringify([{ island: filters.island }])}::jsonb`,
      ),
    );
  }
  if (filters.pricing) {
    conditions.push(eq(projects.pricing, filters.pricing));
  }
  if (filters.availability)
    conditions.push(eq(projects.availability, filters.availability));
  if (filters.helpWanted)
    conditions.push(
      sql`${projects.helpWanted} @> ${JSON.stringify([filters.helpWanted])}::jsonb`,
    );
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
  /** How `week` is matched; see {@link publicProjectFilter}. */
  periodMatch?: PeriodMatch;
};

async function listProjects(
  db: DB,
  { limit, offset, sort, week, periodMatch, ...filters }: ListProjectsOptions,
  userId?: string,
) {
  const { relatedTo, ...publicFilters } = filters;
  let where = publicProjectFilter(week, publicFilters, periodMatch);
  let relatedScore: SQL<number> | undefined;

  if (relatedTo) {
    const reference = await db.query.projects.findFirst({
      where: and(eq(projects.id, relatedTo), publicProjectConditions),
      columns: {
        categoryId: true,
        platform: true,
        audiences: true,
        projectStage: true,
        country: true,
        island: true,
      },
      with: { secondaryMemberships: { columns: { categoryId: true } } },
    });

    if (reference) {
      const categoryIds = [
        reference.categoryId,
        ...reference.secondaryMemberships.map((item) => item.categoryId),
      ].filter((id): id is number => id !== null);
      const categoryMatch = categoryIds.length
        ? sql`case
            when ${inArray(projects.categoryId, categoryIds)} then 5
            when exists (
              select 1 from project_secondary_categories related_categories
              where related_categories.project_id = ${projects.id}
                and ${inArray(sql`related_categories.category_id`, categoryIds)}
            ) then 3 else 0 end`
        : sql`0`;
      const platformMatch = reference.platform.length
        ? sql`case when ${projects.platform} && array[
            ${sql.join(
              reference.platform.map((value) => sql`${value}`),
              sql`, `,
            )}
          ]::platform[] then 3 else 0 end`
        : sql`0`;
      const audienceMatch = reference.audiences.length
        ? sql`case when ${projects.audiences} && array[
            ${sql.join(
              reference.audiences.map((value) => sql`${value}`),
              sql`, `,
            )}
          ]::audience[] then 2 else 0 end`
        : sql`0`;
      const stageMatch = reference.projectStage
        ? sql`case when ${projects.projectStage} = ${reference.projectStage} then 2 else 0 end`
        : sql`0`;
      const locationMatch = reference.country
        ? sql`case
            when ${projects.country} = ${reference.country}
              and ${projects.island} = ${reference.island} then 3
            when ${projects.country} = ${reference.country} then 2
            else 0 end`
        : sql`0`;

      relatedScore = sql<number>`(
        ${categoryMatch} + ${platformMatch} + ${audienceMatch} +
        ${stageMatch} + ${locationMatch}
      )`;
      where = and(where, ne(projects.id, relatedTo));
    }
  }

  // Ranking and paging both happen in SQL, so `period=all` costs one page of
  // rows however large the catalogue gets.
  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(projects).where(where),
    db.query.projects.findMany({
      where,
      with: cardRelations,
      extras: projectEngagementExtras(userId),
      orderBy: relatedScore
        ? [desc(relatedScore), desc(upvoteCountSql), desc(projects.updatedAt)]
        : sort === "upvotes"
          ? [desc(upvoteCountSql), desc(projects.createdAt), desc(projects.id)]
          : [
              desc(projects.publishedAt),
              desc(projects.createdAt),
              desc(projects.id),
            ],
      limit,
      offset,
    }),
  ]);

  return { data: data.map((project) => serializeProject(project)), total };
}

async function listMapProjects(
  db: DB,
  {
    limit,
    offset,
    ...filters
  }: ProjectFilters & { limit: number; offset: number },
) {
  const where = publicProjectFilter(null, filters);
  return db.transaction(
    async (tx) => {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(projects)
        .where(where);
      const rows = await tx
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          shortDescription: projects.shortDescription,
          logoKey: projects.logoKey,
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
        data: rows.map(({ logoKey, ...row }) => ({
          ...withLocation(row),
          logoUrl: toPublicUrl(logoKey),
        })),
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
  // Literal column names: see publicProjectConditions on why the relational
  // query builder needs them.
  const savedAt = sql`(select f.created_at from project_favorites f where f.project_id = ${projects.id} and f.user_id = ${userId})`;
  const where = and(publicProjectConditions, sql`${savedAt} is not null`);

  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(projects).where(where),
    db.query.projects.findMany({
      where,
      with: cardRelations,
      extras: projectEngagementExtras(userId),
      orderBy: [desc(savedAt), desc(projects.id)],
      limit,
      offset,
    }),
  ]);

  return { data: data.map((project) => serializeProject(project)), total };
}

async function getProjectBySlug(db: DB, slug: string, userId?: string) {
  const result = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      ...cardRelations,
      publisher: {
        columns: { handle: true },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
              shadowBannedAt: true,
              shadowBanReason: true,
            },
          },
        },
      },
    },
    extras: projectEngagementExtras(userId),
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
  const hiddenAt =
    project.shadowBannedAt ?? publisher?.user?.shadowBannedAt ?? null;

  const isVisible =
    !project.deletedAt &&
    (project.status === "published" || isOwner) &&
    (!hiddenAt || isOwner);

  if (!isVisible) return null;

  return {
    ...serializeProject(project),
    weeklyRank: await weeklyRankForProject(db, project.id, project.launchedAt),
    badges: await ProjectBadgesService.listForProject(db, project.id),
    bestWeeklyRank: await ProjectBadgesService.bestWeeklyRank(db, project.id),
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
    await lockProjectDestinations(tx);
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
    await assertUniqueProjectLinks(
      tx,
      id,
      serializeProjectLinks(existing.links),
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
        logoKey: existing.logoKey,
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
            }
          : {
              status: "published",
              publishedAt: existing.publishedAt ?? now,
              launchedAt: existing.launchedAt,
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
  const [result] = await db
    .update(projects)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.publisherId, publisherId),
        isNull(projects.deletedAt),
      ),
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
  // Only a publicly visible project can be voted on: no stuffing votes into a
  // draft before it launches, and none on something removed or hidden.
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), publicProjectConditions),
    columns: { id: true },
  });

  if (!project) return null;

  // Delete first, insert only if there was nothing to delete: two concurrent
  // clicks then settle on the unique index instead of failing on it.
  const removed = await db
    .delete(projectUpvotes)
    .where(
      and(
        eq(projectUpvotes.projectId, projectId),
        eq(projectUpvotes.userId, userId),
      ),
    )
    .returning({ id: projectUpvotes.id });

  if (removed.length === 0) {
    await db
      .insert(projectUpvotes)
      .values({
        projectId,
        userId,
        ipAddress: context.ipAddress?.slice(0, 64),
        userAgent: context.userAgent,
      })
      .onConflictDoNothing();
  }

  const [{ upvoteCount }] = await db
    .select({ upvoteCount: count() })
    .from(projectUpvotes)
    .where(eq(projectUpvotes.projectId, projectId));

  if (removed.length === 0) {
    // A milestone plaque is a bonus; a failure here must not fail the vote.
    await ProjectBadgesService.awardUpvoteMilestones(db, projectId, upvoteCount).catch(() => {});
  }

  return { upvoted: removed.length === 0, upvoteCount };
}

async function toggleFavorite(db: DB, projectId: number, userId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), publicProjectConditions),
    columns: { id: true },
  });

  if (!project) return null;

  const removed = await db
    .delete(projectFavorites)
    .where(
      and(
        eq(projectFavorites.projectId, projectId),
        eq(projectFavorites.userId, userId),
      ),
    )
    .returning({ id: projectFavorites.id });

  if (removed.length > 0) return { favorited: false };

  await db
    .insert(projectFavorites)
    .values({ projectId, userId })
    .onConflictDoNothing();
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
  listFavoriteProjects: errorLogger(
    listFavoriteProjects,
    "projectsService.listFavoriteProjects",
  ),
  getProjectBySlug: errorLogger(
    getProjectBySlug,
    "projectsService.getProjectBySlug",
  ),
  toggleUpvote: errorLogger(toggleUpvote, "projectsService.toggleUpvote"),
  toggleFavorite: errorLogger(toggleFavorite, "projectsService.toggleFavorite"),
};
