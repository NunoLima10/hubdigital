import { toAssetUrl } from "@/utils/asset-url";
import { useEffect, useRef, useState } from "react";
import { useSubmitForm } from "../../../hooks/use-submit-form";
import { StepLayout } from "../../components/step-layout/step-layout";
import { ProjectCategories } from "../project-categories/project-categories";
import { ProjectForm } from "../project-form/project-form";
import { ProjectReview } from "../project-review/project-review";
import { Button } from "@/components/ui/button";
import { SubmissionProgress } from "../../components/submission-progress";
import { LocationFields } from "../../components/location-fields/location-fields";

export function FormStepper() {
  const {
    active,
    form,
    saveState,
    recovery,
    resumeRecovery,
    discardRecovery,
    project,
    goToStep,
    isPublishing,
  } = useSubmitForm();
  const galleryImageKeys = form.watch("galleryImageKeys");
  const logoKey = form.watch("logoKey");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>();
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<Record<string, string>>({});
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
      Object.values(galleryPreviewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">
          {project ? "Continuar projeto" : "Partilha o que estás a construir"}
        </h1>
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${saveState === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {saveState === "saving"
            ? "A guardar rascunho…"
            : saveState === "saved"
              ? "Rascunho guardado"
              : saveState === "error"
                ? "Alterações por guardar. Usa Guardar rascunho para tentar novamente."
                : "O rascunho é guardado automaticamente depois de escolheres um nome."}
        </p>
      </div>
      {recovery && (
        <section
          className="space-y-3 rounded-lg border border-primary/30 p-4"
          aria-label="Retomar rascunho"
        >
          <p className="text-sm">
            Encontrámos um rascunho neste navegador:{" "}
            <strong>{recovery.values.name || "Projeto sem nome"}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={resumeRecovery}>Continuar rascunho</Button>
            <Button variant="outline" onClick={discardRecovery}>
              {project ? "Usar versão guardada" : "Começar outro"}
            </Button>
          </div>
        </section>
      )}
      {!recovery && (
        <>
          <SubmissionProgress active={active} onChange={goToStep} disabled={isPublishing} />
          {active < 2 && (
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive" aria-hidden="true">
                *
              </span>{" "}
              Campos obrigatórios para publicar. Podes guardar um rascunho incompleto.
            </p>
          )}
          <StepLayout>
            {active === 0 ? (
              <ProjectForm
                form={form}
                logoPreviewUrl={
                  logoKey === null
                    ? undefined
                    : (logoPreviewUrl ?? toAssetUrl(logoKey) ?? project?.logoUrl ?? undefined)
                }
                galleryPreviewUrls={galleryImageKeys.map(
                  (key) => galleryPreviewUrls[key] ?? toAssetUrl(key) ?? "",
                )}
                onLogoPreviewChange={changeLogoPreview}
                onGalleryPreviewChange={addGalleryPreview}
                onGalleryPreviewRemove={removeGalleryPreview}
              />
            ) : active === 1 ? (
              <ProjectCategories form={form} />
            ) : active === 2 ? (
              <LocationFields form={form} />
            ) : (
              <ProjectReview
                logoPreviewUrl={
                  logoKey === null
                    ? undefined
                    : (logoPreviewUrl ?? toAssetUrl(logoKey) ?? project?.logoUrl ?? undefined)
                }
                galleryPreviewUrls={galleryPreviewUrls}
              />
            )}
          </StepLayout>
        </>
      )}
    </div>
  );
}
