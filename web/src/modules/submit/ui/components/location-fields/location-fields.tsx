import { NativeSelect } from "@/components/ui/native-select";
import type { UseFormReturn } from "react-hook-form";
import {
  countryOptions,
  islandOptions,
  municipalityOptionsOf,
} from "../../../options";
import type { CreateProjectInput } from "../../../types/project";
import { emptyLocation } from "../../../utils/location";

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
        <NativeSelect
          value={location.country}
          onChange={(event) =>
            form.setValue(
              "location",
              {
                ...emptyLocation,
                country: event.target.value as typeof location.country,
              },
              { shouldValidate: true },
            )
          }
          required
        >
          <option value="">Seleciona o país</option>
          {countryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
        <span className="block text-xs font-normal text-muted-foreground">
          De onde é construído o projeto
        </span>
      </label>
      {inCapeVerde && (
        <>
          <label className="block space-y-1.5 text-sm font-medium">
            Ilha
            <NativeSelect
              value={location.island}
              onChange={(event) =>
                form.setValue(
                  "location",
                  {
                    ...emptyLocation,
                    country: "cv",
                    island: event.target.value as typeof location.island,
                  },
                  { shouldValidate: true },
                )
              }
              required
            >
              <option value="">Seleciona a ilha</option>
              {islandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Concelho
            <NativeSelect
              value={location.municipality}
              disabled={!location.island}
              onChange={(event) =>
                form.setValue(
                  "location",
                  {
                    ...location,
                    municipality: event.target
                      .value as typeof location.municipality,
                    zone: "",
                  },
                  { shouldValidate: true },
                )
              }
            >
              <option value="">Opcional</option>
              {location.island &&
                municipalityOptionsOf(location.island).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </NativeSelect>
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
