import { DB } from "@/db";
import { categories } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { asc } from "drizzle-orm";

async function listCategories(db: DB) {
  return db.query.categories.findMany({
    orderBy: asc(categories.name),
  });
}

export const CategoriesService = {
  listCategories: errorLogger(
    listCategories,
    "categoriesService.listCategories"
  ),
};
