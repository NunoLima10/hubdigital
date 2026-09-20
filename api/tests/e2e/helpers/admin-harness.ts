import {
  categories,
  comments,
  moderationActions,
  projectUpvotes,
  projects,
  publishers,
  reports,
  users,
} from "@/db/schemas";
import { setupDB } from "@/db";
import { appSettings } from "@/db/schemas";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

export const migrationsFolder = join(__dirname, "../../../src/db/migrations");

type DB = Awaited<ReturnType<typeof setupDB>>["db"];

/**
 * Order matters: children before parents, or the foreign keys refuse. Every
 * admin test starts from an empty database rather than from whatever the
 * previous test left behind.
 */
export async function resetDb(db: DB) {
  await db.delete(moderationActions);
  await db.delete(reports);
  await db.delete(appSettings);
  await db.delete(comments);
  await db.delete(projectUpvotes);
  await db.delete(projects);
  await db.delete(publishers);
  await db.delete(users);
  await db.delete(categories);
}

export async function insertUser(
  db: DB,
  overrides: Partial<typeof users.$inferInsert> = {}
) {
  const { id: requestedId, ...rest } = overrides;
  const id = requestedId ?? randomUUID();

  await db.insert(users).values({
    id,
    name: "Utilizador",
    email: `user-${id}@example.com`,
    role: "user",
    ...rest,
  });

  return id;
}

export async function insertPublisher(db: DB, userId: string, bio = "Bio") {
  const [publisher] = await db
    .insert(publishers)
    .values({
      userId,
      bio,
      handle: `handle-${userId.slice(0, 8)}`,
      profileResponse: "founder",
      objectiveResponse: "launch-product",
      locationResponse: "CV2",
      foundUsByResponse: "friends",
    })
    .returning({ id: publishers.id });

  return publisher.id;
}

export async function insertCategory(db: DB) {
  const [category] = await db
    .insert(categories)
    .values({ key: "ai", name: "Inteligência Artificial" })
    .returning({ id: categories.id });

  return category.id;
}

export function projectFixture(
  overrides: Partial<typeof projects.$inferInsert> &
    Pick<typeof projects.$inferInsert, "publisherId" | "categoryId" | "slug">
): typeof projects.$inferInsert {
  return {
    name: "Meu Projeto",
    shortDescription: "Uma plataforma para descobrir projetos digitais de CV",
    websiteUrl: "https://hubdigital.cv",
    pricing: "free",
    platform: ["web"],
    businessModel: "b2c",
    access: "public_beta",
    projectStage: "mvp",
    audienceStage: "general_public",
    country: "cv",
    island: "CV2",
    status: "published",
    launchedAt: new Date().toISOString(),
    ...overrides,
  };
}

export async function insertProject(
  db: DB,
  overrides: Parameters<typeof projectFixture>[0]
) {
  const [project] = await db
    .insert(projects)
    .values(projectFixture(overrides))
    .returning({ id: projects.id, slug: projects.slug });

  return project;
}
