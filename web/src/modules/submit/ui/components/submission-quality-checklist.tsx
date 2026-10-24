import { cn } from "@/lib/utils";
import { primaryProjectLink } from "@hubdigital/shared";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useSubmitForm } from "../../hooks/use-submit-form";

type ChecklistItem = {
  label: string;
  description: string;
  complete: boolean;
  step: number;
};

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
  const doesNotNeedPrimaryLink = ["not_available", "unavailable"].includes(
    values.availability,
  );
  const textDescription = (values.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const required: ChecklistItem[] = [
    {
      label: "Nome e descrição curta",
      description: "Explica o projeto de forma clara numa frase.",
      complete: values.name.trim().length >= 2 && values.shortDescription.trim().length >= 10,
      step: 0,
    },
    {
      label: "Fase e disponibilidade",
      description: "Diz o que já existe e como pode ser experimentado.",
      complete: Boolean(values.projectStage && values.availability),
      step: 0,
    },
    {
      label: "Destino principal",
      description: "Escolhe o link que as pessoas devem abrir primeiro.",
      complete: doesNotNeedPrimaryLink || Boolean(primaryProjectLink(values.links)),
      step: 0,
    },
    {
      label: "Categoria principal",
      description: "Ajuda a comunidade a encontrar o projeto.",
      complete: typeof values.categoryId === "number",
      step: 1,
    },
    {
      label: "Uso de IA",
      description: "Partilha de forma transparente como a IA participou.",
      complete: Boolean(values.aiInvolvement),
      step: 3,
    },
  ];
  const recommended: ChecklistItem[] = [
    {
      label: "Logo do projeto",
      description: "Facilita reconhecer o projeto na lista e no mapa.",
      complete: hasLogo,
      step: 0,
    },
    {
      label: "Imagem ou vídeo de demonstração",
      description: "Mostra o produto em uso antes de pedir um clique.",
      complete: values.galleryImageKeys.length > 0 || Boolean(values.youtubeVideoUrl),
      step: 0,
    },
    {
      label: "Descrição detalhada",
      description: "Conta o problema, a solução e para quem foi criada.",
      complete: textDescription.length >= 80,
      step: 0,
    },
    {
      label: "Pedido à comunidade",
      description: "Indica se procuras feedback, testes, parceiros ou ajuda.",
      complete: values.helpWanted.length > 0 || Boolean(values.helpDescription.trim()),
      step: 1,
    },
  ];
  const completedRequired = required.filter((item) => item.complete).length;

  function edit(item: ChecklistItem) {
    if (item.step === 3) {
      document.getElementById("ai-disclosure")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
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
        <span
          className={cn(
            "rounded-full border bg-background px-2.5 py-1 text-xs font-medium tabular-nums",
            completedRequired === required.length && "border-primary/30 text-primary",
          )}
        >
          {completedRequired}/{required.length} essenciais
        </span>
      </div>
      <div className="space-y-4 border-t p-4">
        <ChecklistGroup title="Essencial" items={required} onEdit={edit} />
        <ChecklistGroup title="Ajuda a destacar" items={recommended} onEdit={edit} />
      </div>
    </section>
  );
}
