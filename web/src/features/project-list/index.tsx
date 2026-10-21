import { SUBMIT_URL } from "@/data";
import {
  Anchor,
  Chip,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useSearchParams } from "react-router-dom";
import { Projectcard } from "./components/project-card/project-card";
import { CATEGORIES, ISLANDS, Project } from "./types/project";
import { filterProjects, Sort, SORT_OPTIONS } from "./utils/filter-projects";

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  // Filtros na URL para que uma pesquisa possa ser partilhada (ex: ?categoria=Saúde).
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("categoria");
  const island = params.get("ilha");
  const sort = (params.get("ordem") as Sort | null) ?? "populares";

  function setParam(key: string, value: string | null) {
    setParams(
      (prev) => {
        if (value) prev.set(key, value);
        else prev.delete(key);
        return prev;
      },
      { replace: true },
    );
  }

  const usedCategories = CATEGORIES.filter((c) =>
    projects.some((p) => p.category === c),
  );
  const usedIslands = ISLANDS.filter((i) =>
    projects.some((p) => p.island === i),
  );
  const visible = filterProjects(projects, { query, category, island, sort });

  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <TextInput
          placeholder="Pesquisar sites, apps e plataformas…"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setParam("q", e.currentTarget.value)}
          aria-label="Pesquisar projetos"
        />
        <Chip.Group
          value={category ?? "todas"}
          onChange={(value) =>
            setParam("categoria", value === "todas" ? null : (value as string))
          }
        >
          <Group gap={6}>
            <Chip value="todas" size="xs">
              Todas
            </Chip>
            {usedCategories.map((c) => (
              <Chip key={c} value={c} size="xs">
                {c}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            {visible.length} de {projects.length} projetos
          </Text>
          <Group gap="xs">
            {usedIslands.length > 0 && (
              <Select
                size="xs"
                w={140}
                placeholder="Todas as ilhas"
                data={usedIslands}
                value={island}
                onChange={(value) => setParam("ilha", value)}
                clearable
                aria-label="Filtrar por ilha"
              />
            )}
            <Select
              size="xs"
              w={140}
              data={SORT_OPTIONS.map((o) => ({ ...o }))}
              value={sort}
              onChange={(value) =>
                setParam("ordem", value === "populares" ? null : value)
              }
              allowDeselect={false}
              aria-label="Ordenar"
            />
          </Group>
        </Group>
      </Stack>

      <Stack gap={40}>
        {visible.map((project) => (
          <Projectcard key={project.slug} project={project} />
        ))}
      </Stack>

      {visible.length === 0 && (
        <Text ta="center" c="dimmed" py="xl">
          Nenhum projeto encontrado. Conhece um?{" "}
          <Anchor href={SUBMIT_URL} target="_blank">
            Submeta aqui
          </Anchor>
          .
        </Text>
      )}
    </Stack>
  );
}
