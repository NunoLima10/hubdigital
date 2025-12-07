import { MultiSelect, Select, SimpleGrid, Stack } from "@mantine/core";

type ProjectCategoriesProps = {};

export function ProjectCategories({}: ProjectCategoriesProps) {
  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Maturidade do projeto"
          placeholder="Selecione a maturidade"
          data={[
            "Ideia",
            "Prova de conceito",
            "MVP",
            "Em crescimento",
            "Escalado",
          ]}
        />
        <MultiSelect
          label="Plataformas suportadas"
          placeholder="Selecione plataformas"
          data={["Web", "Mobile (iOS)", "Mobile (Android)", "Desktop", "IoT"]}
        />
        <MultiSelect
          label="Público-alvo"
          placeholder="Selecione público-alvo"
          data={[
            "Consumidor final (B2C)",
            "Empresas (B2B)",
            "Desenvolvedores",
            "Educacional",
            "Governo",
          ]}
        />
        <MultiSelect
          label="Modelo de negócio"
          placeholder="Selecione modelo de negócio"
          data={[
            "Assinatura",
            "Freemium",
            "Compra única",
            "Publicidade",
            "Marketplace",
          ]}
        />
      </SimpleGrid>
      <Select
        label="Localização da sede"
        placeholder="Selecione localização"
        data={[
          "Brasil",
          "Portugal",
          "Estados Unidos",
          "Reino Unido",
          "Alemanha",
        ]}
      />
      <Select
        label="Acesso neste lançamento"
        placeholder="Selecione tipo de acesso"
        data={[
          "Aberto ao público",
          "Beta fechado",
          "Somente por convite",
          "Somente interno",
        ]}
      />
      <MultiSelect
        label="Categorias"
        placeholder="Selecione categorias"
        data={[]}
      />
    </Stack>
  );
}
