import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCategories } from "@/modules/submit/hooks/use-categories";
import { islandOptions, pricingOptions } from "@/modules/submit/options";
import type { Island } from "@hubdigital/shared";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ProjectFilterValues = {
  q?: string;
  island?: Island;
  categoryId?: number;
  pricing?: "free" | "freemium" | "paid";
};
type Props = {
  value: ProjectFilterValues;
  onChange: (next: ProjectFilterValues) => void;
};

export function ProjectFilters({ value, onChange }: Props) {
  const { data: categories } = useCategories();
  const [query, setQuery] = useState(value.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      () => onChange({ ...value, q: next.trim() || undefined }),
      350,
    );
  }
  const hasFilters = Boolean(
    value.q || value.island || value.categoryId || value.pricing,
  );
  return (
    <div className="flex flex-wrap gap-2">
      <label className="relative w-full min-w-40 flex-1 sm:w-auto">
        <span className="sr-only">Procurar projetos</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Procurar projetos..."
          value={query}
          onChange={(event) => changeQuery(event.currentTarget.value)}
        />
      </label>
      <label className="w-[calc(50%-0.25rem)] sm:w-32">
        <span className="sr-only">Ilha</span>
        <Select
          value={value.island ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              island: (event.target.value || undefined) as Island | undefined,
            })
          }
        >
          <option value="">Todas as ilhas</option>
          {islandOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="w-[calc(50%-0.25rem)] sm:w-36">
        <span className="sr-only">Categoria</span>
        <Select
          value={value.categoryId ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              categoryId: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        >
          <option value="">Categorias</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="min-w-28 flex-1 sm:flex-none">
        <span className="sr-only">Preço</span>
        <Select
          value={value.pricing ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              pricing: (event.target.value ||
                undefined) as ProjectFilterValues["pricing"],
            })
          }
        >
          <option value="">Preço</option>
          {pricingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            onChange({});
          }}
        >
          <X />
          Limpar
        </Button>
      )}
    </div>
  );
}
