import { DB } from "@/db";
import { logger } from "@/utils/logger";
import { categories } from "../schemas";

export const categoryType = {
    ai: "Inteligência Artificial",
    health: "Saúde",
    education: "Educação",
    fintech: "Tecnologia Financeira",
    social: "Social",
    travel: "Viagens",
    entertainment: "Entretenimento",
    ecommerce: "Comércio Eletrônico",
    environment: "Meio Ambiente",
    open_source: "Código Aberto",
    other: "Outros"
} as const;

export default async function seed(db: DB) {
  try {
    const exists = await db.query.categories.findFirst({
      columns: {
        id: true,
      },
    });

    if (exists) {
      logger.info("Categories already exist. Skipping...");
      return;
    }

    const values = Object.entries(categoryType).map(([key, name]) => ({
      key,
      name,
    }));
    
    await db.insert(categories).values(values);

    logger.info("Categories seeded successfully.");
  } catch (error) {
    logger.error(error, "Unexpected error during Categories seeding");
  }
}
