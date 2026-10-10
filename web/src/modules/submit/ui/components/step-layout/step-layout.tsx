import { Button } from "@/components/ui/button";
import type { PropsWithChildren } from "react";
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
    isPending,
  } = useSubmitForm();
  return (
    <div className="flex min-h-96 flex-col gap-6">
      <div className="flex-1">{children}</div>
      <div className="flex flex-wrap justify-end gap-2">
        {!isFist && (
          <Button variant="outline" disabled={isPending} onClick={previous}>
            Voltar
          </Button>
        )}
        {!isLast ? (
          <Button disabled={!canProceed} onClick={next}>
            Próximo
          </Button>
        ) : (
          <>
            <Button variant="outline" disabled={isPending} onClick={saveDraft}>
              Guardar rascunho
            </Button>
            <Button disabled={isPending} onClick={publish}>
              {isPending ? "A guardar..." : "Publicar projeto"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
