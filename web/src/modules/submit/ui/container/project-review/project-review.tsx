import { toAssetUrl } from "@/utils/asset-url";
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
import { formatLocationFormValue } from "../../../utils/location";
import { CategoriesDisplay } from "../../components/categories-diplay/categories-display";
import { ProjectCard } from "../../components/project-card/project-card";

export function ProjectReview() {
  const { form } = useSubmitForm();
  const values = form.watch();
  const { data: categories } = useCategories();
  const category = categories?.find((item) => item.id === values.categoryId);
  const location = formatLocationFormValue(values.location);
  const badges = [
    values.pricing && pricingLabels[values.pricing],
    values.businessModel && businessModelLabels[values.businessModel],
  ].filter(Boolean) as string[];
  return (
    <div className="space-y-6">
      <ProjectCard
        name={values.name || "Nome do projeto"}
        description={values.shortDescription || "Pequena descrição do projeto"}
        websiteUrl={values.websiteUrl || "#"}
        iconUrl={toAssetUrl(values.logoUrl)}
        badges={badges}
      />
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoriesDisplay
          label="Categoria"
          badges={category ? [category.name] : []}
        />
        <CategoriesDisplay
          label="Localização"
          badges={location ? [location] : []}
        />
        <CategoriesDisplay
          label="Maturidade"
          badges={
            values.projectStage ? [projectStageLabels[values.projectStage]] : []
          }
        />
        <CategoriesDisplay
          label="Plataformas"
          badges={values.platform.map((platform) => platformLabels[platform])}
        />
        <CategoriesDisplay
          label="Público-alvo"
          badges={
            values.audienceStage ? [audienceLabels[values.audienceStage]] : []
          }
        />
        <CategoriesDisplay
          label="Modelo de negócio"
          badges={
            values.businessModel
              ? [businessModelLabels[values.businessModel]]
              : []
          }
        />
        <CategoriesDisplay
          label="Acesso"
          badges={values.access ? [accessLabels[values.access]] : []}
        />
      </dl>
      {values.description ? (
        <div
          className="prose-project border-t pt-4 text-sm"
          dangerouslySetInnerHTML={{ __html: values.description }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma descrição detalhada foi adicionada.
        </p>
      )}
    </div>
  );
}
