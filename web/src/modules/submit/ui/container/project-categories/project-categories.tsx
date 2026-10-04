import { NativeSelect } from "@/components/ui/native-select";
import type { UseFormReturn } from "react-hook-form";
import { useCategories } from "../../../hooks/use-categories";
import {
  accessOptions,
  audienceOptions,
  businessModelOptions,
  platformOptions,
  pricingOptions,
  projectStageOptions,
} from "../../../options";
import type { CreateProjectInput } from "../../../types/project";
import { LocationFields } from "../../components/location-fields/location-fields";

const fields = [
  {
    name: "projectStage",
    label: "Maturidade do projeto",
    options: projectStageOptions,
  },
  { name: "audienceStage", label: "Público-alvo", options: audienceOptions },
  {
    name: "businessModel",
    label: "Modelo de negócio",
    options: businessModelOptions,
  },
  { name: "access", label: "Acesso neste lançamento", options: accessOptions },
  { name: "pricing", label: "Modelo de preço", options: pricingOptions },
] as const;

export function ProjectCategories({
  form,
}: {
  form: UseFormReturn<CreateProjectInput>;
}) {
  const { data: categories, isLoading } = useCategories();
  const values = form.watch();
  return (
    <div className="space-y-5">
      <LocationFields form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, options }) => (
          <label key={name} className="block space-y-1.5 text-sm font-medium">
            {label}
            <NativeSelect
              required
              value={values[name]}
              onChange={(event) =>
                form.setValue(name, event.target.value as never, {
                  shouldValidate: true,
                })
              }
            >
              <option value="">Seleciona uma opção</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
            {form.formState.errors[name]?.message && (
              <span className="text-xs text-destructive">
                {form.formState.errors[name]?.message}
              </span>
            )}
          </label>
        ))}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Plataformas suportadas
        </legend>
        <div className="flex flex-wrap gap-3">
          {platformOptions.map((option) => (
            <label
              key={option.value}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={values.platform.includes(
                  option.value as CreateProjectInput["platform"][number],
                )}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...values.platform, option.value]
                    : values.platform.filter((item) => item !== option.value);
                  form.setValue(
                    "platform",
                    next as CreateProjectInput["platform"],
                    { shouldValidate: true },
                  );
                }}
                className="accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
        {form.formState.errors.platform && (
          <p className="mt-1 text-xs text-destructive">
            Seleciona pelo menos uma plataforma.
          </p>
        )}
      </fieldset>
      <label className="block space-y-1.5 text-sm font-medium">
        Qual categoria melhor descreve o teu projeto?
        <NativeSelect
          required
          disabled={isLoading}
          value={values.categoryId}
          onChange={(event) =>
            form.setValue(
              "categoryId",
              event.target.value ? Number(event.target.value) : "",
              { shouldValidate: true },
            )
          }
        >
          <option value="">Seleciona uma categoria</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
        {form.formState.errors.categoryId && (
          <span className="text-xs text-destructive">
            {form.formState.errors.categoryId.message}
          </span>
        )}
      </label>
    </div>
  );
}
