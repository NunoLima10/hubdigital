import { UseFormReturnType } from "@mantine/form";
import { MultiSelect, Select, SimpleGrid, Stack } from "@mantine/core";
import { useCategories } from "../../../hooks/use-categories";
import {
  accessOptions,
  audienceOptions,
  businessModelOptions,
  platformOptions,
  pricingOptions,
  projectStageOptions,
} from "../../../options";
import { CreateProjectInput } from "../../../types/project";

type ProjectCategoriesProps = {
  form: UseFormReturnType<CreateProjectInput>;
};

export function ProjectCategories({ form }: ProjectCategoriesProps) {
  const { data: categories, isLoading: isLoadingCategories } =
    useCategories();

  const categoryOptions =
    categories?.map((category) => ({
      value: String(category.id),
      label: category.name,
    })) ?? [];

  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Maturidade do projeto"
          placeholder="Selecione a maturidade"
          data={projectStageOptions}
          required
          {...form.getInputProps("projectStage")}
        />
        <MultiSelect
          label="Plataformas suportadas"
          placeholder="Selecione plataformas"
          data={platformOptions}
          required
          {...form.getInputProps("platform")}
        />
        <Select
          label="Público-alvo"
          placeholder="Selecione público-alvo"
          data={audienceOptions}
          required
          {...form.getInputProps("audienceStage")}
        />
        <Select
          label="Modelo de negócio"
          placeholder="Selecione modelo de negócio"
          data={businessModelOptions}
          required
          {...form.getInputProps("businessModel")}
        />
        <Select
          label="Acesso neste lançamento"
          placeholder="Selecione tipo de acesso"
          data={accessOptions}
          required
          {...form.getInputProps("access")}
        />
        <Select
          label="Modelo de preço"
          placeholder="Selecione o modelo de preço"
          data={pricingOptions}
          required
          {...form.getInputProps("pricing")}
        />
      </SimpleGrid>
      <Select
        label="Qual categoria melhor descreve o teu projeto?"
        placeholder="Procura e escolhe a categoria que melhor descreve a tua ideia"
        data={categoryOptions}
        disabled={isLoadingCategories}
        searchable
        required
        value={form.values.categoryId ? String(form.values.categoryId) : null}
        onChange={(value) =>
          form.setFieldValue("categoryId", value ? Number(value) : "")
        }
        error={form.errors.categoryId}
      />
    </Stack>
  );
}
