import { countryValues, type Country } from "@hubdigital/shared";
import { CountryCombobox } from "@/components/country-combobox/country-combobox";
import { Button } from "@/components/ui/button";

// Curated shortcuts for this community, with worldwide search in the same picker.
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
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        País <span className="font-normal text-muted-foreground">(opcional)</span>
      </p>
      <CountryCombobox
        aria-label="País da base do projeto"
        countries={countryValues}
        featured={baseCountryChoices}
        value={value}
        onChange={onChange}
      />
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
          Não informar país
        </Button>
      )}
    </div>
  );
}
