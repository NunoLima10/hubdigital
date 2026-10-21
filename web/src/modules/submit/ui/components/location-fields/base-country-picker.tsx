import { useState } from "react";
import { countryLabels, type Country } from "@hubdigital/shared";
import { FormSelect } from "../form-select/form-select";
import { CountryPicker } from "./country-picker";

// Curated shortcuts for this community; Other retains worldwide access.
const baseCountryChoices: readonly Country[] = [
  "cv",
  "pt",
  "us",
  "fr",
  "nl",
  "lu",
  "sn",
  "br",
  "es",
  "it",
];

export function BaseCountryPicker({
  value,
  onChange,
}: {
  value: Country | "";
  onChange: (value: Country | "") => void;
}) {
  const [other, setOther] = useState(false);
  const isOther = other || Boolean(value && !baseCountryChoices.includes(value));
  return (
    <div className="space-y-3">
      <label className="block space-y-1.5 text-sm font-medium">
        País <span className="font-normal text-muted-foreground">(opcional)</span>
        <FormSelect
          value={isOther ? "other" : value}
          placeholder="Selecionar país"
          options={[
            { value: "", label: "Não informar" },
            ...baseCountryChoices.map((country) => ({
              value: country,
              label: countryLabels[country],
            })),
            { value: "other", label: "Outro país" },
          ]}
          onValueChange={(country) => {
            setOther(country === "other");
            onChange(country === "other" ? "" : (country as Country | ""));
          }}
        />
      </label>
      {isOther && (
        <CountryPicker
          label="Escolher outro país"
          value={value}
          onChange={(country) => {
            setOther(!country || !baseCountryChoices.includes(country));
            onChange(country);
          }}
        />
      )}
    </div>
  );
}
