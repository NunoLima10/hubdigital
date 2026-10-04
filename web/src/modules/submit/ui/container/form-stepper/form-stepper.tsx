import { useSubmitForm } from "../../../hooks/use-submit-form";
import { StepLayout } from "../../components/step-layout/step-layout";
import { ProjectCategories } from "../project-categories/project-categories";
import { ProjectForm } from "../project-form/project-form";
import { ProjectReview } from "../project-review/project-review";

const labels = ["Descrição", "Categoria", "Revisão"];
export function FormStepper() {
  const { active, form } = useSubmitForm();
  return (
    <div className="space-y-7 p-4">
      <h1 className="text-xl font-semibold">Submeter projeto</h1>
      <ol className="flex gap-2" aria-label={`Passo ${active + 1} de 3`}>
        {labels.map((label, index) => (
          <li
            key={label}
            className={`flex-1 rounded-md border px-3 py-2 text-center text-xs sm:text-sm ${active === index ? "border-primary bg-primary/5 font-semibold text-primary" : index < active ? "border-primary/30" : "text-muted-foreground"}`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      <StepLayout>
        {active === 0 ? (
          <ProjectForm form={form} />
        ) : active === 1 ? (
          <ProjectCategories form={form} />
        ) : (
          <ProjectReview />
        )}
      </StepLayout>
    </div>
  );
}
