import { DB } from "@/db";
import { categories, projects } from "@/db/schemas";
import { PG_ERR_UNIQUE_VIOLATION } from "@/utils/constants";
import { errorLogger } from "@/utils/error-logger";
import { ConflictError } from "@/utils/custom-errors";
import { asc, count, eq } from "drizzle-orm";
import { PostgresError } from "postgres";

/**
 * Categories carry a project count because `projects.category_id` is
 * `onDelete: "restrict"` — a category in use cannot be removed, and the admin UI
 * has to say so before offering the option.
 */
async function listWithCounts(db: DB) {
  const rows = await db.query.categories.findMany({
    orderBy: asc(categories.name),
  });

  const counts = await db
    .select({ categoryId: projects.categoryId, total: count() })
    .from(projects)
    .groupBy(projects.categoryId);

  const byId = new Map(counts.map((row) => [row.categoryId, row.total]));

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    projectCount: byId.get(row.id) ?? 0,
    createdAt: row.createdAt,
  }));
}

function rethrowConflict(error: unknown): never {
  if (
    error instanceof PostgresError &&
    error.code === PG_ERR_UNIQUE_VIOLATION
  ) {
    throw new ConflictError("Já existe uma categoria com essa chave.");
  }

  throw error;
}

async function createCategory(db: DB, input: { key: string; name: string }) {
  try {
    const [created] = await db
      .insert(categories)
      .values(input)
      .returning({ id: categories.id, key: categories.key, name: categories.name });

    return created;
  } catch (error) {
    rethrowConflict(error);
  }
}

/** The key is immutable: it is what the seed and any external reference use. */
async function updateCategory(db: DB, id: number, name: string) {
  const [updated] = await db
    .update(categories)
    .set({ name, updatedAt: new Date().toISOString() })
    .where(eq(categories.id, id))
    .returning({ id: categories.id, key: categories.key, name: categories.name });

  return updated ?? null;
}

export const AdminCategoriesService = {
  listWithCounts: errorLogger(
    listWithCounts,
    "adminCategoriesService.listWithCounts"
  ),
  createCategory: errorLogger(
    createCategory,
    "adminCategoriesService.createCategory"
  ),
  updateCategory: errorLogger(
    updateCategory,
    "adminCategoriesService.updateCategory"
  ),
};
