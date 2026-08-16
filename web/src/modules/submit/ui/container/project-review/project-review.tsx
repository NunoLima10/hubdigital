import { Box, SimpleGrid, Stack, Text } from "@mantine/core";
import { useSubmitForm } from "../../../hooks/use-submit-form";
import { useCategories } from "../../../hooks/use-categories";
import {
  accessLabels,
  audienceLabels,
  businessModelLabels,
  platformLabels,
  pricingLabels,
  projectStageLabels,
} from "../../../options";
import { CategoriesDisplay } from "../../components/categories-diplay/categories-display";
import { ProjectCard } from "../../components/project-card/project-card";

export function ProjectReview() {
  const { form } = useSubmitForm();
  const { data: categories } = useCategories();

  const category = categories?.find((c) => c.id === form.values.categoryId);

  const badges = [
    form.values.pricing && pricingLabels[form.values.pricing],
    form.values.businessModel && businessModelLabels[form.values.businessModel],
  ].filter(Boolean) as string[];

  return (
    <Stack>
      <ProjectCard
        name={form.values.name || "Nome do projeto"}
        description={
          form.values.shortDescription || "Pequena descrição do projeto"
        }
        websiteUrl={form.values.websiteUrl || "#"}
        badges={badges}
      />
      <SimpleGrid cols={{ base: 2, sm: 3 }} w={"100%"}>
        <CategoriesDisplay
          label="Categoria"
          badges={category ? [category.name] : []}
        />
        <CategoriesDisplay
          label="Maturidade do projeto"
          badges={
            form.values.projectStage
              ? [projectStageLabels[form.values.projectStage]]
              : []
          }
        />
        <CategoriesDisplay
          label="Plataformas suportadas"
          badges={form.values.platform.map((p) => platformLabels[p])}
        />
        <CategoriesDisplay
          label="Público-alvo"
          badges={
            form.values.audienceStage
              ? [audienceLabels[form.values.audienceStage]]
              : []
          }
        />
        <CategoriesDisplay
          label="Modelo de negócio"
          badges={
            form.values.businessModel
              ? [businessModelLabels[form.values.businessModel]]
              : []
          }
        />
        <CategoriesDisplay
          label="Acesso"
          badges={
            form.values.access ? [accessLabels[form.values.access]] : []
          }
        />
      </SimpleGrid>

      {form.values.description && (
        <Box
          dangerouslySetInnerHTML={{ __html: form.values.description }}
        />
      )}
      {!form.values.description && (
        <Text c="dimmed">Nenhuma descrição detalhada foi adicionada.</Text>
      )}
    </Stack>
  );
}
