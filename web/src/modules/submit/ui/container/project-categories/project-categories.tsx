import type { UseFormReturn } from "react-hook-form";
import { ProjectCategoryPicker } from "../../components/project-category-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories } from "../../../hooks/use-categories";
import {
  sourceModelOptions,
  audienceOptions,
  businessModelOptions,
  platformOptions,
  pricingOptions,
} from "../../../options";
import type { CreateProjectInput } from "../../../types/project";
import { FormSelect } from "../../components/form-select/form-select";

export function ProjectCategories({ form }: { form: UseFormReturn<CreateProjectInput> }) {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const values = form.watch();
  return (
    <div className="space-y-6">
      <ProjectCategoryPicker
        form={form}
        categories={categories ?? []}
        disabled={isLoading || isError}
      />
      {isLoading && <p className="text-sm text-muted-foreground">A carregar categorias…</p>}
      {isError && (
        <div className="text-sm">
          <p>Não foi possível carregar as categorias. Podes guardar o rascunho.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {(
        [
          { name: "platform", label: "Plataformas (opcional)", options: platformOptions },
          { name: "audiences", label: "Para quem é útil? (opcional)", options: audienceOptions },
        ] as const
      ).map(({ name, label, options }) => (
        <fieldset key={name} className="space-y-2">
          <legend className="text-sm font-medium">{label}</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={(values[name] as string[]).includes(option.value)}
                  className="accent-primary"
                  onChange={(event) =>
                    form.setValue(
                      name,
                      (event.target.checked
                        ? [...values[name], option.value]
                        : values[name].filter((value) => value !== option.value)) as never,
                      { shouldDirty: true },
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {(
        [
          { name: "pricing", label: "Monetização", options: pricingOptions },
          { name: "businessModel", label: "Modelo de negócio", options: businessModelOptions },
        ] as const
      ).map(({ name, label, options }) => (
        <div key={name} className={name === "pricing" ? "border-t pt-5" : undefined}>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>
              {label} <span className="font-normal text-muted-foreground">(opcional)</span>
            </span>
            <FormSelect
              value={values[name]}
              options={[{ value: "", label: "Não informar" }, ...options]}
              placeholder="Não informar"
              invalid={Boolean(form.formState.errors[name])}
              onValueChange={(value) => form.setValue(name, value as never, { shouldDirty: true })}
            />
            {form.formState.errors[name]?.message && (
              <span className="text-xs text-destructive">
                {form.formState.errors[name]?.message}
              </span>
            )}
          </label>
        </div>
      ))}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">
          Código-fonte <span className="font-normal text-muted-foreground">(opcional)</span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block min-w-0 space-y-1.5 text-sm font-medium">
            Acesso <span className="font-normal text-muted-foreground">(opcional)</span>
            <FormSelect
              value={values.sourceModel}
              options={[{ value: "", label: "Não informar" }, ...sourceModelOptions]}
              placeholder="Não informar"
              invalid={Boolean(form.formState.errors.sourceModel)}
              onValueChange={(value) =>
                form.setValue("sourceModel", value as CreateProjectInput["sourceModel"], {
                  shouldDirty: true,
                })
              }
            />
            {form.formState.errors.sourceModel?.message && (
              <span className="text-xs text-destructive">
                {form.formState.errors.sourceModel.message}
              </span>
            )}
          </label>
          <label className="block min-w-0 space-y-1.5 text-sm font-medium">
            Licença <span className="font-normal text-muted-foreground">(opcional)</span>
            <Input
              placeholder="MIT, Apache-2.0…"
              maxLength={80}
              {...form.register("licenseId")}
              aria-invalid={Boolean(form.formState.errors.licenseId)}
            />
            {form.formState.errors.licenseId?.message && (
              <span className="text-xs text-destructive">
                {form.formState.errors.licenseId.message}
              </span>
            )}
          </label>
        </div>
        {values.sourceModel === "open_source" &&
          !values.links.some((link) => link.kind === "repository") &&
          values.links.length < 8 && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                form.setValue(
                  "links",
                  [
                    ...values.links,
                    {
                      kind: "repository",
                      url: "",
                      label: "",
                      isPrimary: values.links.length === 0,
                      referralAttribution: false,
                    },
                  ],
                  { shouldDirty: true },
                )
              }
            >
              Adicionar repositório (opcional)
            </Button>
          )}
      </fieldset>
    </div>
  );
}
