import { useId, useState } from "react";
import { countryLabels, countryValues, type Country } from "@hubdigital/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export function CountryPicker({
  value,
  onChange,
  label = "País",
  clearable = true,
  clearLabel = "Não informar",
  placeholder,
}: {
  value: Country | "";
  onChange: (value: Country | "") => void;
  label?: string;
  clearable?: boolean;
  clearLabel?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const id = useId();
  const choices = countryValues
    .filter((code) => normalize(countryLabels[code] + " " + code).includes(normalize(search)))
    .sort((a, b) => countryLabels[a].localeCompare(countryLabels[b], "pt"));
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {value
          ? countryLabels[value]
          : label.startsWith("Adicionar")
            ? label
            : (placeholder ?? "Selecionar país")}
      </Button>
      {open && (
        <div id={id} className="space-y-2 rounded-md border p-2">
          <Input
            autoFocus
            aria-label={`Pesquisar ${label.toLowerCase()}`}
            placeholder="Pesquisar país…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className="max-h-48 overflow-y-auto">
            {clearable && (
              <li>
                <button
                  type="button"
                  className="w-full rounded px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  {clearLabel}
                </button>
              </li>
            )}
            {choices.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  className="w-full rounded px-2 py-2 text-left text-sm hover:bg-accent focus-visible:outline-ring"
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {countryLabels[code]}
                </button>
              </li>
            ))}
          </ul>
          {!choices.length && (
            <p className="text-xs text-muted-foreground">Nenhum país encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
