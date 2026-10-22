import { ProjectDestinationActions } from "@/components/project-destination-actions";
import { toAssetUrl } from "@/utils/asset-url";
import { ProjectGallery } from "@/components/project-gallery/project-gallery";
import { getYoutubeVideoId } from "@hubdigital/shared";
import { useSubmitForm } from "../../../hooks/use-submit-form";
import { useCategories } from "../../../hooks/use-categories";
import {
  availabilityLabels,
  sourceModelLabels,
  audienceLabels,
  businessModelLabels,
  platformLabels,
  pricingLabels,
  projectStageLabels,
} from "../../../options";
import { locationFromFormValue } from "../../../utils/location";
import { ProjectGeography } from "@/components/project-geography";
import { locationSchema } from "@hubdigital/shared";
import { CategoriesDisplay } from "../../components/categories-diplay/categories-display";
import { ProjectCard } from "../../components/project-card/project-card";

export function ProjectReview({
  logoPreviewUrl,
  galleryPreviewUrls,
}: {
  logoPreviewUrl?: string;
  galleryPreviewUrls?: Record<string, string>;
}) {
  const { form } = useSubmitForm();
  const values = form.watch();
  const { data: categories } = useCategories();
  const category = categories?.find((item) => item.id === values.categoryId);
  const location = locationSchema.safeParse(locationFromFormValue(values.location));
  const badges = [
    values.pricing && pricingLabels[values.pricing],
    values.businessModel && businessModelLabels[values.businessModel],
  ].filter(Boolean) as string[];
  return (
    <div className="space-y-6">
      <ProjectCard
        name={values.name || "Nome do projeto"}
        description={values.shortDescription || "Pequena descrição do projeto"}
        iconUrl={logoPreviewUrl ?? toAssetUrl(values.logoKey)}
        badges={badges}
      />
      <ProjectDestinationActions
        links={values.links}
        availability={values.availability}
        feedbackHref="#preview-feedback"
      />
      <ProjectGallery
        imageUrls={values.galleryImageKeys
          .map((key) => galleryPreviewUrls?.[key] ?? toAssetUrl(key))
          .filter((url): url is string => Boolean(url))}
        youtubeVideoId={values.youtubeVideoUrl ? getYoutubeVideoId(values.youtubeVideoUrl) : null}
        projectName={values.name || "Projeto"}
      />
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoriesDisplay
          label="Categorias"
          badges={[
            ...(category ? [`${category.name} (principal)`] : []),
            ...values.secondaryCategoryIds
              .map((id) => categories?.find((item) => item.id === id)?.name)
              .filter((name): name is string => Boolean(name)),
          ]}
        />
        <ProjectGeography
          project={{
            location: location.success ? location.data : null,
            additionalLocations: [],
            teamMode: null,
            serviceArea: null,
            localConnections: values.localConnections,
          }}
        />
        <CategoriesDisplay
          label="Maturidade"
          badges={values.projectStage ? [projectStageLabels[values.projectStage]] : []}
        />
        <CategoriesDisplay
          label="Plataformas"
          badges={values.platform.map((platform) => platformLabels[platform])}
        />
        <CategoriesDisplay
          label="Público-alvo"
          badges={values.audiences.map((audience) => audienceLabels[audience])}
        />
        <CategoriesDisplay
          label="Modelo de negócio"
          badges={values.businessModel ? [businessModelLabels[values.businessModel]] : []}
        />
        <CategoriesDisplay
          label="Disponibilidade"
          badges={values.availability ? [availabilityLabels[values.availability]] : []}
        />
        <CategoriesDisplay
          label="Código-fonte"
          badges={values.sourceModel ? [sourceModelLabels[values.sourceModel]] : []}
        />
      </dl>
      <p id="preview-feedback" className="text-xs text-muted-foreground">
        Depois de publicar, a comunidade pode dar feedback nos comentários.
      </p>
      {values.description ? (
        <div
          className="prose-project border-t pt-4 text-sm"
          dangerouslySetInnerHTML={{ __html: values.description }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma descrição detalhada foi adicionada.</p>
      )}
    </div>
  );
}
