import { Combobox } from "@base-ui/react/combobox";
import { countryLabels, type Country } from "@hubdigital/shared";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { CountryFlag } from "@/components/country-flag/country-flag";
import { cn } from "@/lib/utils";

type CountryGroup = { label: string; items: Country[] };

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Matches the Portuguese name anywhere, or the ISO code exactly ("us", "pt").
function matches(country: Country, query: string) {
  const q = normalize(query.trim());
  return !q || normalize(countryLabels[country]).includes(q) || country === q;
}

/**
 * A select with a search box for picking one country. `featured` countries are
 * listed first so the common answers need no scrolling or typing.
 */
export function CountryCombobox({
  countries,
  featured = [],
  value,
  onChange,
  placeholder = "Selecionar país",
  className,
  "aria-label": ariaLabel,
}: {
  countries: readonly Country[];
  featured?: readonly Country[];
  value: Country | "";
  onChange: (value: Country | "") => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const byName = (a: Country, b: Country) => countryLabels[a].localeCompare(countryLabels[b], "pt");
  const shortcuts = featured.filter((country) => countries.includes(country));
  const groups: CountryGroup[] = [
    { label: "Mais escolhidos", items: shortcuts },
    { label: "Todos os países", items: countries.filter((c) => !shortcuts.includes(c)).sort(byName) },
  ].filter((group) => group.items.length);

  return (
    <Combobox.Root
      items={groups}
      value={value || null}
      onValueChange={(next) => onChange((next as Country | null) ?? "")}
      itemToStringLabel={(country: Country) => countryLabels[country]}
      filter={(country: Country, query) => matches(country, query)}
      autoHighlight
    >
      <Combobox.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group flex h-12 w-full items-center gap-3 rounded-lg border bg-background px-4 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-popup-open:border-primary",
          className,
        )}
      >
        {value ? (
          <>
            <CountryFlag country={value} className="text-lg" />
            <span className="flex-1 truncate font-medium">{countryLabels[value]}</span>
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 group-data-popup-open:rotate-180" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="isolate z-50">
          <Combobox.Popup className="flex max-h-[min(22rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <Combobox.Input
                placeholder="Pesquisar país…"
                className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
              />
            </div>
            <Combobox.Empty className="px-4 py-6 text-center text-sm text-muted-foreground empty:hidden">
              Nenhum país encontrado.
            </Combobox.Empty>
            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden">
              {(group: CountryGroup) => (
                <Combobox.Group key={group.label} items={group.items}>
                  <Combobox.GroupLabel className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                    {group.label}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(country: Country) => (
                      <Combobox.Item
                        key={country}
                        value={country}
                        className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                      >
                        <CountryFlag country={country} className="text-base" />
                        <span className="flex-1 truncate">{countryLabels[country]}</span>
                        <Combobox.ItemIndicator>
                          <CheckIcon className="size-4 text-primary" />
                        </Combobox.ItemIndicator>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
