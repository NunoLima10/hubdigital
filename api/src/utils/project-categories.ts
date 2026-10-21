import type { DB } from "@/db";
import { categories, projects, projectSecondaryCategories } from "@/db/schemas";
import { refineProjectCategories, secondaryCategoryIdsSchema, type CategorySummary } from "@hubdigital/shared";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { ProjectPublicationError } from "./project-publication";

export const secondaryCategoriesWith = {
  with: { category: true },
  orderBy: projectSecondaryCategories.position,
} as const;

export function serializeProjectCategories(memberships: { position: number; category: CategorySummary }[]) {
  const secondaryCategories = [...memberships].sort((a, b) => a.position - b.position).map(({ category }) => ({ id: category.id, key: category.key, name: category.name }));
  return { secondaryCategories, secondaryCategoryIds: secondaryCategories.map(({ id }) => id) };
}

const selectionSchema = z.object({ categoryId: z.number().int().positive().nullish(), secondaryCategoryIds: secondaryCategoryIdsSchema }).superRefine(refineProjectCategories);

export async function assertProjectCategories(db: Pick<DB, "query">, categoryId: number | null | undefined, secondaryCategoryIds: number[]) {
  const result = selectionSchema.safeParse({ categoryId, secondaryCategoryIds });
  if (!result.success) throw new ProjectPublicationError(result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
  const ids = categoryId ? [categoryId, ...secondaryCategoryIds] : [];
  if (!ids.length) return;
  const known = await db.query.categories.findMany({ where: inArray(categories.id, ids), columns: { id: true } });
  const missing = ids.filter((id) => !known.some((category) => category.id === id));
  if (missing.length) throw new ProjectPublicationError([{ path: missing.includes(categoryId!) ? "categoryId" : "secondaryCategoryIds", message: "Esta categoria já não está disponível. Escolhe outra." }]);
}

export async function syncSecondaryCategories(tx: Pick<DB, "insert" | "delete">, projectId: number, ids: number[]) {
  await tx.delete(projectSecondaryCategories).where(eq(projectSecondaryCategories.projectId, projectId));
  if (ids.length) await tx.insert(projectSecondaryCategories).values(ids.map((categoryId, position) => ({ projectId, categoryId, position })));
}

// Correlate only the root project column. Literal subquery columns prevent the
// relational query builder from re-aliasing membership columns as project ones.
export function projectCategoryFilter(categoryId: number) {
  return sql`(${projects.categoryId} = ${categoryId} or exists (
    select 1 from ${projectSecondaryCategories} as membership
    where membership.project_id = ${projects.id} and membership.category_id = ${categoryId}
  ))`;
}
