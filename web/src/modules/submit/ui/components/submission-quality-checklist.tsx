import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useSubmitForm } from "../../hooks/use-submit-form";
import {
  getSubmissionQuality,
  type QualityCriterion,
} from "../../utils/quality-score";
import { SubmissionQualityScore } from "./submission-quality-score";

type ChecklistItem = QualityCriterion;

function ChecklistGroup({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: ChecklistItem[];
  onEdit: (item: ChecklistItem) => void;
}) {
  return (
    <div>
      <h3 className="px-4 pb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="divide-y rounded-md border bg-background">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onEdit(item)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={`${item.label}: ${item.complete ? "completo" : "por completar"}. Editar`}
          >
            {item.complete ? (
              <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{item.label}</span>
              {!item.complete && (
                <span className="block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
              )}
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SubmissionQualityChecklist({ hasLogo }: { hasLogo: boolean }) {
  const { form, goToStep } = useSubmitForm();
  const values = form.watch();
  const quality = getSubmissionQuality(values, hasLogo);

  function edit(item: ChecklistItem) {
    goToStep(item.step);
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-muted/25" aria-labelledby="quality-checklist-title">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <h2 id="quality-checklist-title" className="text-sm font-semibold">
            Checklist antes de publicar
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Completa o essencial para publicar. As restantes sugestões ajudam o projeto a
            ser compreendido, mas não bloqueiam a publicação.
          </p>
        </div>
        <SubmissionQualityScore quality={quality} />
      </div>
      <div className="space-y-4 border-t p-4">
        <ChecklistGroup title="Essencial" items={quality.required} onEdit={edit} />
        <ChecklistGroup title="Ajuda a destacar" items={quality.recommended} onEdit={edit} />
      </div>
    </section>
  );
}
