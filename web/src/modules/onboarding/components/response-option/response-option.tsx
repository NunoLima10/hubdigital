import { CountryCombobox } from "@/components/country-combobox/country-combobox";
import { IslandIcon } from "@/components/island-icon/island-icon";
import { cn } from "@/lib/utils";
import { islandValues, type Island } from "@hubdigital/shared";
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
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-[background-color,border-color,transform] duration-150 select-none hover:bg-muted/50 active:scale-[0.98] has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 motion-reduce:active:scale-100",
        checked && "border-primary bg-primary-soft hover:bg-primary-soft",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
          checked && "bg-primary/10 text-primary",
        )}
      >
        <ResponseIcon value={value} />
      </span>
      <span className="flex-1 font-medium">{children}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked && "border-primary bg-primary text-primary-foreground",
        )}
      >
        {checked && <Check className="size-3 animate-in zoom-in-0 duration-200" strokeWidth={3} />}
      </span>
    </label>
  );
}

/** Shown in place of the islands once "Na diáspora" is picked. */
export function DiasporaCountryField({
  value,
  onChange,
  onBack,
}: {
  value: DiasporaCountry | "";
  onChange: (country: DiasporaCountry | "") => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
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
        value={value}
        onChange={(country) => onChange(country as DiasporaCountry | "")}
      />
    </div>
  );
}
