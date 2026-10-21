import { Button } from "@/components/ui/button";

const steps = [
  { name: "Projeto", description: "Nome, links e imagens" },
  { name: "Detalhes", description: "Categorias e acesso" },
  { name: "Base", description: "Localização e ligação" },
  { name: "Revisão", description: "Confirma e publica" },
];

export function SubmissionProgress({
  active,
  onChange,
  disabled,
}: {
  active: number;
  onChange: (step: number) => void;
  disabled: boolean;
}) {
  return (
    <nav aria-label="Passos de publicação" className="relative">
      <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-6 border-t" />
      <ol className="relative grid grid-cols-4 gap-1" aria-label={`Passo ${active + 1} de 4`}>
        {steps.map((step, index) => (
          <li key={step.name}>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              aria-current={active === index ? "step" : undefined}
              aria-label={`Passo ${index + 1}: ${step.name}`}
              className="h-auto w-full flex-col gap-2 px-1 py-2"
              onClick={() => onChange(index)}
            >
              <span
                aria-hidden="true"
                className={`flex size-8 items-center justify-center rounded-full border text-xl font-semibold ${
                  active === index
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < active
                      ? "border-primary/30 bg-primary-soft text-primary"
                      : "bg-background text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`text-xs sm:text-sm ${active === index ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {step.name}
              </span>
              <span className="hidden text-xs font-normal text-muted-foreground sm:block">
                {step.description}
              </span>
            </Button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
