import { Button } from "@/components/ui/button";
import { ViewTransition, type PropsWithChildren } from "react";
import { useSubmitForm } from "../../../hooks/use-submit-form";

export function StepLayout({ children }: PropsWithChildren) {
  const {
    isFist,
    isLast,
    next,
    previous,
    canProceed,
    saveDraft,
    publish,
    isSaving,
    isPublishing,
    canSave,
    recovery,
  } = useSubmitForm();
  return (
    <div className="flex min-h-96 flex-col gap-6">
      <ViewTransition
        default="none"
        update={{
          default: "none",
          "submit-forward": "submit-forward",
          "submit-backward": "submit-backward",
        }}
      >
        <fieldset inert={isPublishing} disabled={isPublishing} className="min-w-0 flex-1">{children}</fieldset>
      </ViewTransition>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={isSaving || isPublishing || !canSave} onClick={saveDraft}>
          {isSaving ? "A guardar..." : "Guardar rascunho"}
        </Button>
        {!isFist && (
          <Button variant="outline" disabled={isPublishing} onClick={previous}>
            Voltar
          </Button>
        )}
        {!isLast ? (
          <Button disabled={!canProceed || isPublishing} onClick={next}>
            Próximo
          </Button>
        ) : (
          <>
            <Button disabled={isPublishing || Boolean(recovery)} onClick={publish}>
              {isPublishing ? "A publicar..." : "Publicar projeto"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
