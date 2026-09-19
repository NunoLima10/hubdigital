import { fetchCategories, fetchProjects, type ProjectQuery } from "@/api/admin";
import { ProjectLink } from "@/components/entity-link/entity-link";
import { PageHeader } from "@/components/page-header/page-header";
import {
  HiddenBadge,
  ProjectStatusBadge,
} from "@/components/status-badge/status-badge";
import { relativeTime } from "@/utils/relative-time";
import { projectStatusValues } from "@hubdigital/shared";
import {
  Card,
  Group,
  Loader,
  Pagination,
  Select,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_staff/projects/")({
  component: RouteComponent,
});

const PAGE_SIZE = 25;

const statusOptions = [
  { value: "", label: "Todos os estados" },
  ...projectStatusValues.map((status) => ({
    value: status,
    label: {
      draft: "Rascunho",
      pending: "Em revisão",
      published: "Publicado",
      rejected: "Rejeitado",
    }[status],
  })),
];

const visibilityOptions = [
  { value: "", label: "Todos" },
  { value: "hidden", label: "Só ocultados" },
  { value: "deleted", label: "Só eliminados" },
];

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<string>("");
  const [visibility, setVisibility] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const query: ProjectQuery = {
    q: debounced || undefined,
    status: (status || undefined) as ProjectQuery["status"],
    categoryId: categoryId ? Number(categoryId) : undefined,
    hidden: visibility === "hidden" ? true : undefined,
    deleted: visibility === "deleted" ? true : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { data, isPending } = useQuery({
    queryKey: ["admin", "projects", query],
    queryFn: () => fetchProjects(query),
  });

  const total = data?.meta.total ?? 0;

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Tudo, incluindo rascunhos, ocultados e eliminados."
        action={
          <Text size="sm" c="dimmed">
            {total} resultado{total === 1 ? "" : "s"}
          </Text>
        }
      />

      <Card withBorder padding="md" mb="md">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Nome, descrição ou slug"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPage(1);
            }}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            data={statusOptions}
            value={status}
            onChange={(value) => {
              setStatus(value ?? "");
              setPage(1);
            }}
            w={180}
            allowDeselect={false}
          />
          <Select
            data={visibilityOptions}
            value={visibility}
            onChange={(value) => {
              setVisibility(value ?? "");
              setPage(1);
            }}
            w={170}
            allowDeselect={false}
          />
          <Select
            placeholder="Categoria"
            data={[
              { value: "", label: "Todas as categorias" },
              ...(categories ?? []).map((category) => ({
                value: String(category.id),
                label: category.name,
              })),
            ]}
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value ?? "");
              setPage(1);
            }}
            w={200}
            allowDeselect={false}
          />
        </Group>
      </Card>

      <Card withBorder padding={0}>
        {isPending ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Projeto</Table.Th>
                  <Table.Th>Autor</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Votos</Table.Th>
                  <Table.Th>Comentários</Table.Th>
                  <Table.Th>Criado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.data.map((project) => (
                  <Table.Tr key={project.id}>
                    <Table.Td>
                      <ProjectLink id={project.id} size="sm" fw={500}>
                        {project.name}
                      </ProjectLink>
                      <Text size="xs" c="dimmed">
                        {project.slug}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{project.publisher?.user.name ?? "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ProjectStatusBadge status={project.status} />
                        {project.shadowBannedAt && <HiddenBadge size="sm" />}
                      </Group>
                    </Table.Td>
                    <Table.Td>{project.upvoteCount}</Table.Td>
                    <Table.Td>{project.commentCount}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {relativeTime(project.createdAt)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {data?.data.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" ta="center" py="lg">
                        Nenhum projeto corresponde a estes filtros.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {total > PAGE_SIZE && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(total / PAGE_SIZE)}
          />
        </Group>
      )}
    </>
  );
}
