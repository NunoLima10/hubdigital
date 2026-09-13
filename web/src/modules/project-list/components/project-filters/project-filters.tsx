import { useCategories } from "@/modules/submit/hooks/use-categories";
import { islandOptions, pricingOptions } from "@/modules/submit/options";
import type { Island } from "@hubdigital/shared";
import {
  Button,
  CloseButton,
  Group,
  Select,
  TextInput,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export type ProjectFilterValues = {
  q?: string;
  island?: Island;
  categoryId?: number;
  pricing?: "free" | "freemium" | "paid";
};

type ProjectFiltersProps = {
  value: ProjectFilterValues;
  onChange: (next: ProjectFilterValues) => void;
};

export function ProjectFilters({ value, onChange }: ProjectFiltersProps) {
  const { data: categories } = useCategories();
  const [query, setQuery] = useState(value.q ?? "");

  // Keep the field in step when the URL changes from outside (back button,
  // a shared link, the clear button).
  useEffect(() => {
    setQuery(value.q ?? "");
  }, [value.q]);

  // Typing shouldn't fire a request per keystroke.
  const commitQuery = useDebouncedCallback((next: string) => {
    onChange({ ...value, q: next || undefined });
  }, 350);

  const categoryOptions =
    categories?.map((category) => ({
      value: String(category.id),
      label: category.name,
    })) ?? [];

  const hasFilters = Boolean(
    value.q || value.island || value.categoryId || value.pricing
  );

  return (
    <Group gap="sm" align="flex-end" wrap="wrap">
      <TextInput
        placeholder="Procurar projetos..."
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          commitQuery(event.currentTarget.value);
        }}
        rightSection={
          query ? (
            <CloseButton
              size="sm"
              onClick={() => {
                setQuery("");
                onChange({ ...value, q: undefined });
              }}
            />
          ) : null
        }
        style={{ flex: 1, minWidth: 220 }}
      />

      <Select
        placeholder="Ilha"
        data={islandOptions}
        value={value.island ?? null}
        onChange={(island) =>
          onChange({ ...value, island: (island as Island) ?? undefined })
        }
        clearable
        searchable
        w={160}
      />

      <Select
        placeholder="Categoria"
        data={categoryOptions}
        value={value.categoryId ? String(value.categoryId) : null}
        onChange={(categoryId) =>
          onChange({
            ...value,
            categoryId: categoryId ? Number(categoryId) : undefined,
          })
        }
        clearable
        searchable
        w={190}
      />

      <Select
        placeholder="Preço"
        data={pricingOptions}
        value={value.pricing ?? null}
        onChange={(pricing) =>
          onChange({
            ...value,
            pricing: (pricing as ProjectFilterValues["pricing"]) ?? undefined,
          })
        }
        clearable
        w={140}
      />

      {hasFilters && (
        <Button variant="subtle" onClick={() => onChange({})}>
          Limpar
        </Button>
      )}
    </Group>
  );
}
