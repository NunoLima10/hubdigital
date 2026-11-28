import { CountryCombobox } from "@/components/country-combobox/country-combobox";
import { IslandIcon } from "@/components/island-icon/island-icon";
import { cn } from "@/lib/utils";
import { islandLabels, islandValues, type Island } from "@hubdigital/shared";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CodeXml,
  Compass,
  Globe,
  GraduationCap,
  HandCoins,
  Megaphone,
  MessageCircleHeart,
  Rocket,
  Search,
  Telescope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { diasporaCountryValues, featuredDiasporaCountries } from "../../questions";

// The pieces onboarding and the profile preferences share, so an answer looks
// the same wherever it is picked or changed.

export type DiasporaCountry = (typeof diasporaCountryValues)[number];

const responseIcons: Record<string, LucideIcon> = {
  student: GraduationCap,
  "technology-professional": CodeXml,
  founder: Rocket,
  investor: HandCoins,
  "discover-products": Compass,
  "launch-product": Megaphone,
  networking: UsersRound,
  explore: Telescope,
  diaspora: Globe,
  "social-media": MessageCircleHeart,
  friends: UsersRound,
  event: CalendarDays,
  "online-search": Search,
};

const isIsland = (value: string): value is Island =>
  (islandValues as readonly string[]).includes(value);

export function ResponseIcon({ value }: { value: string }) {
  if (isIsland(value)) return <IslandIcon island={value} className="size-6" />;
  const Icon = responseIcons[value];
  return Icon ? <Icon className="size-5" /> : null;
}

export function ResponseOption({
  name,
  value,
  checked,
  onSelect,
  multiple = false,
  disabled = false,
  compact = false,
  description,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  /** A checkbox (one of several picks) instead of a radio. */
  multiple?: boolean;
  disabled?: boolean;
  /**
   * On small screens, a smaller icon and no check mark (the border shows the
   * choice), so two options fit side by side.
   */
  compact?: boolean;
  /** A short second line under the label. */
  description?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-[background-color,border-color,transform] duration-150 select-none hover:bg-muted/50 active:scale-[0.98] has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 motion-reduce:active:scale-100",
        checked && "border-primary bg-primary-soft hover:bg-primary-soft",
        disabled && "cursor-not-allowed opacity-50",
        compact && "gap-2 px-2.5 sm:gap-3 sm:px-3",
      )}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
          checked && "bg-primary/10 text-primary",
          compact && "size-7 sm:size-10",
        )}
      >
        <ResponseIcon value={value} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{children}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center border transition-colors",
          // Square for checkboxes, round for radios, like native controls.
          multiple ? "rounded-md" : "rounded-full",
          checked && "border-primary bg-primary text-primary-foreground",
          compact && "hidden sm:flex",
        )}
      >
        {checked && <Check className="size-3 animate-in zoom-in-0 duration-200" strokeWidth={3} />}
      </span>
    </label>
  );
}

/**
 * The location question: the diaspora as its own featured choice on top, then
 * the nine islands.
 */
export function LocationOptions({
  name,
  options,
  value,
  onSelect,
}: {
  name: string;
  options: readonly { value: string; display: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const diaspora = options.find((option) => option.value === "diaspora");
  const islands = options.filter((option) => option.value !== "diaspora");
  return (
    <div className="space-y-5">
      {diaspora && (
        <ResponseOption
          name={name}
          value={diaspora.value}
          checked={value === diaspora.value}
          onSelect={() => onSelect(diaspora.value)}
          description="Vives fora de Cabo Verde"
        >
          {diaspora.display}
        </ResponseOption>
      )}
      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Em Cabo Verde
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {islands.map((option) => (
            <ResponseOption
              key={option.value}
              name={name}
              value={option.value}
              compact
              checked={value === option.value}
              onSelect={() => onSelect(option.value)}
            >
              {option.display}
            </ResponseOption>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Shown in place of the islands once "Na diáspora" is picked: the country
 * (optional) and the island of origin, so makers abroad still count for
 * their island.
 */
export function DiasporaFields({
  country,
  onCountryChange,
  originIsland,
  onOriginIslandChange,
  onBack,
}: {
  country: DiasporaCountry | "";
  onCountryChange: (country: DiasporaCountry | "") => void;
  originIsland: Island | "";
  onOriginIslandChange: (island: Island | "") => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            Em que país? <span className="font-normal text-muted-foreground">(opcional)</span>
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            onClick={onBack}
          >
            <ArrowLeft className="size-3.5" />
            Voltar às ilhas
          </button>
        </div>
        <CountryCombobox
          aria-label="País onde vives"
          countries={diasporaCountryValues}
          featured={featuredDiasporaCountries}
          value={country}
          onChange={(value) => onCountryChange(value as DiasporaCountry | "")}
        />
      </div>
      <fieldset aria-describedby="origin-island-hint">
        <legend className="text-sm font-medium">Ilha de origem (opcional)</legend>
        <p id="origin-island-hint" className="mt-0.5 text-xs text-muted-foreground">
          Se quiseres, indica a tua ilha de origem ou a da tua família.
        </p>
        {/* Two columns even on a phone, so the nine islands stay a short list. */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {islandValues.map((island) => (
            <ResponseOption
              key={island}
              name="originIsland"
              value={island}
              compact
              checked={originIsland === island}
              onSelect={() => onOriginIslandChange(island)}
            >
              {islandLabels[island]}
            </ResponseOption>
          ))}
        </div>
        {originIsland && (
          <button type="button" className="mt-2 text-sm underline" onClick={() => onOriginIslandChange("")}>
            Limpar seleção
          </button>
        )}
      </fieldset>
    </div>
  );
}
