import { toAssetUrl } from "@/utils/asset-url";
import { useEffect, useRef, useState } from "react";
import { useSubmitForm } from "../../../hooks/use-submit-form";
import { StepLayout } from "../../components/step-layout/step-layout";
import { ProjectCategories } from "../project-categories/project-categories";
import { ProjectForm } from "../project-form/project-form";
import { ProjectReview } from "../project-review/project-review";

const labels = ["Descrição", "Categoria", "Revisão"];
export function FormStepper() {
  const { active, form } = useSubmitForm();
  const galleryImageKeys = form.watch("galleryImageKeys");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>();
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<
    Record<string, string>
  >({});
  const logoPreviewRef = useRef<string | undefined>(undefined);
  const galleryPreviewsRef = useRef<Record<string, string>>({});

  function changeLogoPreview(file: File | null) {
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    const next = file ? URL.createObjectURL(file) : undefined;
    logoPreviewRef.current = next;
    setLogoPreviewUrl(next);
  }

  function addGalleryPreview(key: string, file: File) {
    const nextUrl = URL.createObjectURL(file);
    const previous = galleryPreviewsRef.current[key];
    if (previous) URL.revokeObjectURL(previous);
    galleryPreviewsRef.current = {
      ...galleryPreviewsRef.current,
      [key]: nextUrl,
    };
    setGalleryPreviewUrls(galleryPreviewsRef.current);
  }

  function removeGalleryPreview(key: string) {
    const current = galleryPreviewsRef.current[key];
    if (current) URL.revokeObjectURL(current);
    const next = { ...galleryPreviewsRef.current };
    delete next[key];
    galleryPreviewsRef.current = next;
    setGalleryPreviewUrls(next);
  }

  useEffect(
    () => () => {
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
      Object.values(galleryPreviewsRef.current).forEach((url) =>
        URL.revokeObjectURL(url),
      );
    },
    [],
  );

  return (
    <div className="space-y-7">
      <h1 className="hidden text-xl font-semibold lg:block">
        Submeter projeto
      </h1>
      <ol className="flex gap-2" aria-label={`Passo ${active + 1} de 3`}>
        {labels.map((label, index) => (
          <li
            key={label}
            className={`flex-1 rounded-md border px-3 py-2 text-center text-xs sm:text-sm ${active === index ? "border-primary bg-primary-soft font-semibold text-primary" : index < active ? "border-primary/30" : "text-muted-foreground"}`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {active < 2 && (
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive" aria-hidden="true">*</span>{" "}
          Campos obrigatórios
        </p>
      )}
      <StepLayout>
        {active === 0 ? (
          <ProjectForm
            form={form}
            logoPreviewUrl={logoPreviewUrl}
            galleryPreviewUrls={galleryImageKeys.map(
              (key) => galleryPreviewUrls[key] ?? toAssetUrl(key) ?? "",
            )}
            onLogoPreviewChange={changeLogoPreview}
            onGalleryPreviewChange={addGalleryPreview}
            onGalleryPreviewRemove={removeGalleryPreview}
          />
        ) : active === 1 ? (
          <ProjectCategories form={form} />
        ) : (
          <ProjectReview
            logoPreviewUrl={logoPreviewUrl}
            galleryPreviewUrls={galleryPreviewUrls}
          />
        )}
      </StepLayout>
    </div>
  );
}
