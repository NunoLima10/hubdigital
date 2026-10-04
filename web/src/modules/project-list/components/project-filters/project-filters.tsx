import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/modules/submit/hooks/use-categories";
import { islandOptions, pricingOptions } from "@/modules/submit/options";
import type { Island } from "@hubdigital/shared";
import { Search } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";

export type ProjectFilterValues = {
  q?: string;
  island?: Island;
  categoryId?: number;
  pricing?: "free" | "freemium" | "paid";
};

type FilterOption = { value: string; label: string };

function FilterSelect({
  label,
  value,
  options,
  onChange,
  portalContainer,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  portalContainer: RefObject<HTMLElement | null>;
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => onChange(next ?? "all")}
    >
      <SelectTrigger
        aria-label={label}
        className="w-full min-w-0 rounded-md bg-background"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        portalContainer={portalContainer}
        alignItemWithTrigger={false}
        align="start"
        className="max-h-64 w-max min-w-56 max-w-[calc(100vw-2rem)] rounded-lg p-1 shadow-lg ring-1 ring-border"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="rounded-md"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectFilters({
  value,
  onChange,
  autoFocusSearch = false,
  portalContainer,
}: {
  value: ProjectFilterValues;
  onChange: (next: ProjectFilterValues) => void;
  autoFocusSearch?: boolean;
  portalContainer: RefObject<HTMLElement | null>;
}) {
  const { data: categories } = useCategories();
  const [query, setQuery] = useState(value.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const latestValue = useRef(value);
  latestValue.current = value;

  useEffect(() => {
    if (!autoFocusSearch) return;
    const frame = requestAnimationFrame(() => searchInput.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocusSearch]);
  useEffect(() => setQuery(value.q ?? ""), [value.q]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function changeQuery(next: string) {
    setQuery(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => onChange({ ...latestValue.current, q: next.trim() || undefined }),
      350,
    );
  }

  const islandItems = [
    { value: "all", label: "Todas as ilhas" },
    ...islandOptions,
  ];
  const categoryItems = [
    { value: "all", label: "Categorias" },
    ...(categories ?? []).map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];
  const pricingItems = [{ value: "all", label: "Preço" }, ...pricingOptions];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1.4fr_1fr]">
      <label className="relative col-span-full">
        <span className="sr-only">Procurar projetos</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          ref={searchInput}
          className="pl-9"
          placeholder="Procurar projetos..."
          value={query}
          onChange={(event) => changeQuery(event.currentTarget.value)}
        />
      </label>
      <FilterSelect
        label="Ilha"
        value={value.island ?? "all"}
        options={islandItems}
        onChange={(next) =>
          onChange({
            ...value,
            island: next === "all" ? undefined : (next as Island),
          })
        }
        portalContainer={portalContainer}
      />
      <FilterSelect
        label="Categoria"
        value={
          value.categoryId === undefined ? "all" : String(value.categoryId)
        }
        options={categoryItems}
        onChange={(next) =>
          onChange({
            ...value,
            categoryId: next === "all" ? undefined : Number(next),
          })
        }
        portalContainer={portalContainer}
      />
      <div className="col-span-full sm:col-span-1">
        <FilterSelect
          label="Preço"
          value={value.pricing ?? "all"}
          options={pricingItems}
          onChange={(next) =>
            onChange({
              ...value,
              pricing:
                next === "all"
                  ? undefined
                  : (next as ProjectFilterValues["pricing"]),
            })
          }
          portalContainer={portalContainer}
        />
      </div>
    </div>
  );
}
