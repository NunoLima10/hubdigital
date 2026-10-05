import type { UseFormReturn } from "react-hook-form";
import {
  countryOptions,
  islandOptions,
  municipalityOptionsOf,
} from "../../../options";
import type { CreateProjectInput } from "../../../types/project";
import { emptyLocation } from "../../../utils/location";
import { FormSelect } from "../form-select/form-select";

export function LocationFields({
  form,
}: {
  form: UseFormReturn<CreateProjectInput>;
}) {
  const location = form.watch("location");
  const inCapeVerde = location.country === "cv";
  return (
    <fieldset className="grid gap-4 sm:grid-cols-3">
      <legend className="mb-3 text-sm font-semibold">Localização</legend>
      <label
        className={`block space-y-1.5 text-sm font-medium ${inCapeVerde ? "" : "sm:col-span-3"}`}
      >
        País de origem
        <FormSelect
          value={location.country}
          options={countryOptions}
          placeholder="Seleciona o país"
          invalid={Boolean(form.formState.errors.location)}
          onValueChange={(value) =>
            form.setValue(
              "location",
              {
                ...emptyLocation,
                country: value as typeof location.country,
              },
              { shouldValidate: true },
            )
          }
        />
        <span className="block text-xs font-normal text-muted-foreground">
          De onde é construído o projeto
        </span>
      </label>
      {inCapeVerde && (
        <>
          <label className="block space-y-1.5 text-sm font-medium">
            Ilha
            <FormSelect
              value={location.island}
              options={islandOptions}
              placeholder="Seleciona a ilha"
              invalid={Boolean(form.formState.errors.location)}
              onValueChange={(value) =>
                form.setValue(
                  "location",
                  {
                    ...emptyLocation,
                    country: "cv",
                    island: value as typeof location.island,
                  },
                  { shouldValidate: true },
                )
              }
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Concelho
            <FormSelect
              value={location.municipality}
              disabled={!location.island}
              options={
                location.island ? municipalityOptionsOf(location.island) : []
              }
              placeholder="Opcional"
              onValueChange={(value) =>
                form.setValue(
                  "location",
                  {
                    ...location,
                    municipality: value as typeof location.municipality,
                    zone: "",
                  },
                  { shouldValidate: true },
                )
              }
            />
          </label>
        </>
      )}
      {form.formState.errors.location && (
        <p className="text-xs text-destructive sm:col-span-3">
          Seleciona uma localização válida.
        </p>
      )}
    </fieldset>
  );
}
