import { ProjectDestinationActions } from "@/components/project-destination-actions";
import { toAssetUrl } from "@/utils/asset-url";
import { ProjectGallery } from "@/components/project-gallery/project-gallery";
import { getYoutubeVideoId } from "@hubdigital/shared";
import { useSubmitForm } from "../../../hooks/use-submit-form";
import { useCategories } from "../../../hooks/use-categories";
import {
  aiInvolvementDescriptions,
  aiInvolvementLabels,
  aiInvolvementValues,
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
import { RequiredIndicator } from "@/components/required-indicator/required-indicator";
import { cn } from "@/lib/utils";
import { SubmissionQualityChecklist } from "../../components/submission-quality-checklist";

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
      <SubmissionQualityChecklist hasLogo={Boolean(logoPreviewUrl ?? values.logoKey)} />
      <fieldset id="ai-disclosure" className="space-y-3 rounded-lg border bg-muted/25 p-4">
        <legend className="px-1 text-sm font-semibold">
          Como usaste IA para criar este projeto?
          <RequiredIndicator />
        </legend>
        <p className="text-xs leading-5 text-muted-foreground">
          Esta informação será pública e serve apenas para dar contexto ao processo, não
          para avaliar a qualidade do projeto.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {aiInvolvementValues.map((value) => {
            const selected = values.aiInvolvement === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border bg-background p-3 text-sm transition-colors",
                  "hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                  selected && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  value={value}
                  className="mt-0.5 size-4 accent-primary"
                  {...form.register("aiInvolvement")}
                />
                <span>
                  <span className="block font-medium">{aiInvolvementLabels[value]}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {aiInvolvementDescriptions[value]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {form.formState.errors.aiInvolvement?.message && (
          <p className="text-xs text-destructive">
            {form.formState.errors.aiInvolvement.message}
          </p>
        )}
      </fieldset>
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
