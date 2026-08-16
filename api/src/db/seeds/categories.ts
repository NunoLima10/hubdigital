import { DB } from "@/db";
import { logger } from "@/utils/logger";
import { categories } from "../schemas";

export const categoryType = {
  saas: "SaaS",
  developer_tools: "Ferramentas para Programadores",
  ai: "Inteligência Artificial",
  fintech: "Fintech",
  ecommerce: "Comércio Eletrónico",
  productivity: "Produtividade",
  marketing: "Marketing",
  design: "Design & Criatividade",
  data_analytics: "Dados & Analytics",
  cybersecurity: "Cibersegurança",
  hr: "Recursos Humanos",
  logistics: "Logística & Mobilidade",
  agritech: "Agricultura & Agritech",
  govtech: "Governo & Cidadania Digital",
  education: "Educação",
  health: "Saúde",
  travel: "Turismo",
  social: "Social & Comunidade",
  entertainment: "Entretenimento & Media",
  environment: "Sustentabilidade & Ambiente",
  open_source: "Código Aberto",
  other: "Outros",
} as const;

export default async function seed(db: DB) {
  try {
    const values = Object.entries(categoryType).map(([key, name]) => ({
      key,
      name,
    }));

    await db
      .insert(categories)
      .values(values)
      .onConflictDoNothing({ target: categories.key });

    logger.info("Categories seeded successfully.");
  } catch (error) {
    logger.error(error, "Unexpected error during Categories seeding");
  }
}
