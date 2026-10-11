import { ImageSelector } from "@/components/image-selector/image-selector";
import { GalleryImageSelector } from "@/components/gallery-image-selector/gallery-image-selector";
import { RequiredIndicator } from "@/components/required-indicator/required-indicator";
import { Input } from "@/components/ui/input";
import { getYoutubeVideoId } from "@hubdigital/shared";
import type { UseFormReturn } from "react-hook-form";
import type { CreateProjectInput } from "../../../types/project";
import { DescriptionEditor } from "../../components/description-editor/description-editor";

type Props = {
  form: UseFormReturn<CreateProjectInput>;
  logoPreviewUrl?: string;
  galleryPreviewUrls?: string[];
  onLogoPreviewChange?: (file: File | null) => void;
  onGalleryPreviewChange?: (key: string, file: File) => void;
  onGalleryPreviewRemove?: (key: string) => void;
};
export function ProjectForm({
  form,
  logoPreviewUrl,
  galleryPreviewUrls,
  onLogoPreviewChange,
  onGalleryPreviewChange,
  onGalleryPreviewRemove,
}: Props) {
  const values = form.watch();
  const fields = [
    ["name", "Nome do projeto", "Meu Projeto", "text", true],
    [
      "shortDescription",
      "Pequena descrição",
      "O que resolve o teu projeto?",
      "text",
      true,
    ],
    ["websiteUrl", "Website", "https://hubdigital.cv/", "url", true],
    [
      "githubUrl",
      "GitHub",
      "https://github.com/organizacao/projeto",
      "url",
      false,
    ],
  ] as const;
  return (
    <div className="space-y-5">
      {fields.map(([name, label, placeholder, type, required]) => (
        <label key={name} className="block space-y-1.5 text-sm font-medium">
          {label}
          {required && <RequiredIndicator />}
          <Input
            type={type}
            placeholder={placeholder}
            required={required}
            {...form.register(name)}
          />
          {form.formState.errors[name]?.message && (
            <span className="text-xs text-destructive">
              {form.formState.errors[name]?.message}
            </span>
          )}
        </label>
      ))}
      <div>
        <p className="mb-1.5 text-sm font-medium">Descrição detalhada</p>
        <DescriptionEditor
          value={values.description}
          onChange={(html) =>
            form.setValue("description", html, { shouldValidate: true })
          }
        />
      </div>
      <ImageSelector
        label="Logo"
        type="project_logo"
        recomandations="PNG, JPG ou WebP até 5 MB"
        actionLabel="Carregar logo"
        value={values.logoUrl}
        previewUrl={logoPreviewUrl}
        onChange={(key) =>
          form.setValue("logoUrl", key, { shouldValidate: true })
        }
        onPreviewChange={onLogoPreviewChange}
        error={form.formState.errors.logoUrl?.message}
      />
      <div className="space-y-2">
        <label className="block space-y-1.5 text-sm font-medium">
          Trailer no YouTube
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            {...form.register("youtubeVideoUrl")}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Opcional. Quando existir, o trailer aparece primeiro na galeria.
        </p>
        {form.formState.errors.youtubeVideoUrl?.message && (
          <p className="text-xs text-destructive">
            {form.formState.errors.youtubeVideoUrl.message}
          </p>
        )}
        {values.youtubeVideoUrl && getYoutubeVideoId(values.youtubeVideoUrl) && (
          <div className="relative aspect-video max-w-sm overflow-hidden rounded-lg border bg-muted">
            <img
              src={`https://i.ytimg.com/vi/${getYoutubeVideoId(values.youtubeVideoUrl)}/hqdefault.jpg`}
              alt="Pré-visualização do trailer"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/15 text-sm font-semibold text-white">
              Trailer · primeira posição
            </span>
          </div>
        )}
      </div>
      <GalleryImageSelector
        value={values.galleryImageKeys}
        previewUrls={galleryPreviewUrls}
        onChange={(keys) =>
          form.setValue("galleryImageKeys", keys, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        onPreviewChange={onGalleryPreviewChange}
        onPreviewRemove={onGalleryPreviewRemove}
        error={form.formState.errors.galleryImageKeys?.message}
      />
    </div>
  );
}
