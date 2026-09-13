import { fetchUsers, type UserQuery } from "@/api/admin";
import { UserLink } from "@/components/entity-link/entity-link";
import { PageHeader } from "@/components/page-header/page-header";
import {
  BannedBadge,
  HiddenBadge,
} from "@/components/status-badge/status-badge";
import { relativeTime } from "@/utils/relative-time";
import {
  Badge,
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

export const Route = createFileRoute("/_staff/users/")({
  component: RouteComponent,
});

const PAGE_SIZE = 25;

const stateOptions = [
  { value: "", label: "Todas as contas" },
  { value: "staff", label: "Equipa" },
  { value: "hidden", label: "Ocultadas" },
  { value: "banned", label: "Banidas" },
];

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 300);
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);

  const query: UserQuery = {
    q: debounced || undefined,
    state: (state || undefined) as UserQuery["state"],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { data, isPending } = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => fetchUsers(query),
  });

  const total = data?.meta.total ?? 0;

  return (
    <>
      <PageHeader
        title="Utilizadores"
        description="Contas, papéis e sanções."
        action={
          <Text size="sm" c="dimmed">
            {total} conta{total === 1 ? "" : "s"}
          </Text>
        }
      />

      <Card withBorder padding="md" mb="md">
        <Group gap="sm">
          <TextInput
            placeholder="Nome ou email"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPage(1);
            }}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select
            data={stateOptions}
            value={state}
            onChange={(value) => {
              setState(value ?? "");
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
                  <Table.Th>Conta</Table.Th>
                  <Table.Th>Papel</Table.Th>
                  <Table.Th>Projetos</Table.Th>
                  <Table.Th>Comentários</Table.Th>
                  <Table.Th>Votos</Table.Th>
                  <Table.Th>Registo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.data.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap={6}>
                        <UserLink id={user.id} size="sm" fw={500}>
                          {user.name}
                        </UserLink>
                        {user.shadowBannedAt && <HiddenBadge size="sm" />}
                        {user.banned && <BannedBadge size="sm" />}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={user.role === "admin" ? "red" : "gray"}
                      >
                        {user.role === "admin" ? "Admin" : "Utilizador"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{user.projectCount}</Table.Td>
                    <Table.Td>{user.commentCount}</Table.Td>
                    <Table.Td>{user.upvoteCount}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {relativeTime(user.createdAt)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {data?.data.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" ta="center" py="lg">
                        Nenhuma conta corresponde a estes filtros.
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
