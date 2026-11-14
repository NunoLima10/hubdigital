import { useSubmitForm } from "../../../hooks/use-submit-form";
import {
  aiInvolvementDescriptions,
  aiInvolvementLabels,
  aiInvolvementValues,
} from "../../../options";
import { RequiredIndicator } from "@/components/required-indicator/required-indicator";
import { cn } from "@/lib/utils";
import { ProjectCollaborators } from "@/modules/community/project-collaborators";
import { ProjectRequestsFields } from "../../components/project-requests-fields";

export function ProjectCommunityStep() {
  const { form, savedProjectId, teamInvites, setTeamInvites } =
    useSubmitForm();
  const values = form.watch();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Comunidade</h2>
        <p className="text-sm text-muted-foreground">
          Identifica a equipa do projeto, pede feedback e partilha como usaste IA.
        </p>
      </div>
      <ProjectCollaborators
        projectId={savedProjectId}
        selection={{ invites: teamInvites, onChange: setTeamInvites }}
      />
      <ProjectRequestsFields form={form} />
      <fieldset
        id="ai-disclosure"
        className="space-y-3 rounded-lg border bg-muted/25 p-4"
      >
        <legend className="px-1 text-sm font-semibold">
          Como usaste IA para criar este projeto?
          <RequiredIndicator />
        </legend>
        <p className="text-xs leading-5 text-muted-foreground">
          Esta informação será pública e serve apenas para dar contexto ao
          processo, não para avaliar a qualidade do projeto.
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
                  aria-describedby={
                    form.formState.errors.aiInvolvement
                      ? "ai-involvement-error"
                      : undefined
                  }
                  className="mt-0.5 size-4 accent-primary"
                  {...form.register("aiInvolvement")}
                />
                <span>
                  <span className="block font-medium">
                    {aiInvolvementLabels[value]}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {aiInvolvementDescriptions[value]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {form.formState.errors.aiInvolvement?.message && (
          <p
            id="ai-involvement-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {form.formState.errors.aiInvolvement.message}
          </p>
        )}
      </fieldset>
    </div>
  );
}
