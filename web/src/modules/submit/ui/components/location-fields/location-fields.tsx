import { Select, SimpleGrid } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import {
  countryOptions,
  islandOptions,
  municipalityOptionsOf,
} from "../../../options";
import type { CreateProjectInput } from "../../../types/project";
import { emptyLocation } from "../../../utils/location";

type LocationFieldsProps = {
  form: UseFormReturnType<CreateProjectInput>;
};

/**
 * Country, then — only inside Cabo Verde — island and municipality. Each level
 * clears the ones beneath it when it changes, since an island belongs to one
 * country and a municipality to one island; leaving them would submit a
 * location the server rejects.
 */
export function LocationFields({ form }: LocationFieldsProps) {
  const { location } = form.values;
  const inCapeVerde = location.country === "cv";

  // A missing country fails at the object itself, not at `location.country`.
  const countryError = form.errors.location ?? form.errors["location.country"];

  return (
    <SimpleGrid cols={{ base: 1, sm: inCapeVerde ? 3 : 1 }}>
      <Select
        label="País de origem"
        placeholder="Selecione o país"
        description="De onde é construído o projeto"
        data={countryOptions}
        searchable
        required
        value={location.country || null}
        onChange={(country) => {
          form.setFieldValue("location", {
            ...emptyLocation,
            country: (country as typeof location.country) ?? "",
          });
          form.clearFieldError("location");
        }}
        error={countryError}
      />
      {inCapeVerde && (
        <Select
          label="Ilha"
          placeholder="Selecione a ilha"
          data={islandOptions}
          searchable
          required
          value={location.island || null}
          onChange={(island) =>
            form.setFieldValue("location", {
              ...emptyLocation,
              country: "cv",
              island: (island as typeof location.island) ?? "",
            })
          }
          error={form.errors["location.island"]}
        />
      )}
      {inCapeVerde && (
        <Select
          label="Concelho"
          placeholder={
            location.island ? "Selecione o concelho" : "Escolha primeiro a ilha"
          }
          description="Opcional"
          data={location.island ? municipalityOptionsOf(location.island) : []}
          disabled={!location.island}
          clearable
          value={location.municipality || null}
          onChange={(municipality) =>
            form.setFieldValue("location", {
              ...location,
              municipality: (municipality as typeof location.municipality) ?? "",
              // A zone belongs to one municipality; it cannot outlive a change.
              zone: "",
            })
          }
          error={form.errors["location.municipality"]}
        />
      )}
    </SimpleGrid>
  );
}
