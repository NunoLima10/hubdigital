import { useState } from "react";
import { MapPin } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { localConnectionLabels, localConnectionValues } from "@hubdigital/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { islandOptions } from "../../../options";
import type { CreateProjectInput } from "../../../types/project";
import { emptyLocation, type LocationFormValue } from "../../../utils/location";
import { FormSelect } from "../form-select/form-select";
import { BaseCountryPicker } from "./base-country-picker";
import { PublicPinPicker } from "./public-pin-picker";

export function LocationFields({ form }: { form: UseFormReturn<CreateProjectInput> }) {
  const location = form.watch("location");
  const connections = form.watch("localConnections");
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const showMap =
    Boolean(location.country) &&
    !collapsed &&
    (expanded || Boolean(location.publicPin) || location.country !== "cv");
  const setLocation = (value: LocationFormValue) => {
    form.setValue("location", value, { shouldDirty: true });
    form.clearErrors("location");
  };
  return (
    <div className="space-y-6">
      <section className="space-y-4" aria-labelledby="project-base-title">
        <h2 id="project-base-title" className="text-sm font-medium">
          Base do projeto <span className="font-normal text-muted-foreground">(opcional)</span>
        </h2>
        <BaseCountryPicker
          value={location.country}
          onChange={(country) => {
            if (country === location.country) return;
            setLocation({ ...emptyLocation, country });
            setExpanded(false);
            setCollapsed(false);
          }}
        />
        {location.country && (
          <>
            <div className={`grid gap-4 ${location.country === "cv" ? "sm:grid-cols-2" : ""}`}>
              {location.country === "cv" && (
                <label className="block space-y-1.5 text-sm font-medium">
                  Ilha <span className="font-normal text-muted-foreground">(opcional)</span>
                  <FormSelect
                    value={location.island}
                    placeholder="Selecionar ilha"
                    options={[{ value: "", label: "Não informar" }, ...islandOptions]}
                    onValueChange={(island) =>
                      setLocation({
                        ...location,
                        island: island as LocationFormValue["island"],
                        municipality: "",
                        zone: "",
                        locality: "",
                        publicPin: null,
                      })
                    }
                  />
                </label>
              )}
              <label className="block space-y-1.5 text-sm font-medium">
                Cidade ou localidade{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
                <Input
                  aria-label="Cidade ou localidade"
                  value={location.locality}
                  maxLength={120}
                  placeholder={
                    location.country === "cv" ? "Praia, Mindelo…" : "Cidade onde estás a construir"
                  }
                  onChange={(event) => setLocation({ ...location, locality: event.target.value })}
                />
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Marca um ponto para as pessoas encontrarem o projeto e a comunidade perto de ti.
              </p>
              <Button
                type="button"
                variant="outline"
                aria-expanded={showMap}
                onClick={() => {
                  setExpanded(true);
                  setCollapsed(showMap);
                }}
              >
                <MapPin aria-hidden="true" />
                {showMap
                  ? "Fechar mapa"
                  : location.publicPin
                    ? "Editar ponto no mapa"
                    : "Marcar no mapa"}
              </Button>
            </div>
            {showMap && (
              <PublicPinPicker
                key={`${location.country}:${location.island}`}
                country={location.country}
                island={location.island || undefined}
                value={location.publicPin}
                onChange={(publicPin) => setLocation({ ...location, publicPin })}
              />
            )}
          </>
        )}
        {form.formState.errors.location && (
          <p role="alert" className="text-xs text-destructive">
            Confirma a ilha e o ponto escolhido. A localização é opcional.
          </p>
        )}
      </section>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Ligação a Cabo Verde <span className="font-normal text-muted-foreground">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {localConnectionValues.map((connection) => (
            <label
              key={connection}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                className="accent-primary"
                checked={connections.includes(connection)}
                onChange={(event) =>
                  form.setValue(
                    "localConnections",
                    event.target.checked
                      ? [...connections, connection]
                      : connections.filter((value) => value !== connection),
                    { shouldDirty: true },
                  )
                }
              />
              {localConnectionLabels[connection]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
