import type { UseFormReturn } from "react-hook-form";
import { helpWantedLabels, helpWantedValues } from "@hubdigital/shared";
import type { CreateProjectInput } from "../../types/project";

export function ProjectRequestsFields({
  form,
}: {
  form: UseFormReturn<CreateProjectInput>;
}) {
  const selected = form.watch("helpWanted");
  return (
    <fieldset className="space-y-3 border-t pt-5">
      <legend className="text-sm font-semibold">
        O que procuras?{" "}
        <span className="font-normal text-muted-foreground">(opcional)</span>
      </legend>
      <p className="text-xs leading-5 text-muted-foreground">
        Diz à comunidade como pode ajudar. Estas escolhas aparecem no projeto e
        na pesquisa.
      </p>
      <div className="flex flex-wrap gap-2">
        {helpWantedValues.map((value) => (
          <label
            key={value}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${selected.includes(value) ? "border-primary bg-primary/5" : ""}`}
          >
            <input
              type="checkbox"
              className="accent-primary"
              checked={selected.includes(value)}
              onChange={(event) =>
                form.setValue(
                  "helpWanted",
                  event.target.checked
                    ? [...selected, value]
                    : selected.filter((item) => item !== value),
                  { shouldDirty: true },
                )
              }
            />
            {helpWantedLabels[value]}
          </label>
        ))}
      </div>
      <label className="block space-y-1.5 text-sm">
        Como podem ajudar?{" "}
        <span className="text-muted-foreground">(opcional)</span>
        <textarea
          className="min-h-24 w-full rounded-md border bg-background p-3 text-base md:text-sm focus-visible:outline-2 focus-visible:outline-ring"
          maxLength={500}
          placeholder="Conta o que precisas e como entrar em contacto…"
          {...form.register("helpDescription")}
        />
      </label>
      {form.formState.errors.helpDescription?.message && (
        <p role="alert" className="text-xs text-destructive">
          {form.formState.errors.helpDescription.message}
        </p>
      )}
    </fieldset>
  );
}
