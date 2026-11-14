import {
  createCategory,
  fetchAdminCategories,
  updateCategory,
} from "@/api/admin";
import { PageHeader } from "@/components/page-header/page-header";
import type { AdminCategory } from "@hubdigital/shared";
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconInfoCircle, IconPencil, IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_staff/categories")({
  component: RouteComponent,
});

const CATEGORIES_KEY = ["admin", "categories"];

function RouteComponent() {
  const [createOpened, createModal] = useDisclosure(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const { data, isPending } = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: fetchAdminCategories,
  });

  const create = useMutation({
    mutationFn: createCategory,
    meta: {
      invalidatesQuery: CATEGORIES_KEY,
      successMessage: "Categoria criada.",
      errorMessage: "Não foi possível criar a categoria.",
    },
    onSuccess: createModal.close,
  });

  const update = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateCategory(id, name),
    meta: {
      invalidatesQuery: CATEGORIES_KEY,
      successMessage: "Categoria atualizada.",
      errorMessage: "Não foi possível atualizar a categoria.",
    },
    onSuccess: () => setEditing(null),
  });

  const createForm = useForm({
    initialValues: { key: "", name: "" },
    validate: {
      key: (value) =>
        /^[a-z0-9_]{2,40}$/.test(value)
          ? null
          : "Só minúsculas, números e underscore.",
      name: (value) => (value.trim().length >= 2 ? null : "Nome demasiado curto"),
    },
  });

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Usadas no formulário de submissão e nos filtros do site."
        action={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              createForm.reset();
              createModal.open();
            }}
          >
            Nova categoria
          </Button>
        }
      />

      <Alert
        variant="light"
        icon={<IconInfoCircle size={18} />}
        mb="md"
      >
        A chave é permanente — é o que liga a categoria à seed e a qualquer
        referência externa. Uma categoria com projetos associados não pode ser
        eliminada; mude-lhe o nome ou deixe de a usar.
      </Alert>

      <Card withBorder padding={0}>
        {isPending ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : (
          <Table.ScrollContainer minWidth={560}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Chave</Table.Th>
                  <Table.Th>Projetos</Table.Th>
                  <Table.Th w={60} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.map((category) => (
                  <Table.Tr key={category.id}>
                    <Table.Td>
                      <Text size="sm">{category.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Code>{category.key}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={category.projectCount > 0 ? "blue" : "gray"}
                      >
                        {category.projectCount}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="compact-sm"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditing(category)}
                      >
                        Editar
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal
        opened={createOpened}
        onClose={createModal.close}
        title="Nova categoria"
        centered
      >
        <form onSubmit={createForm.onSubmit((values) => create.mutate(values))}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              placeholder="Ex.: Turismo"
              {...createForm.getInputProps("name")}
            />
            <TextInput
              label="Chave"
              description="Permanente. Ex.: travel"
              placeholder="travel"
              {...createForm.getInputProps("key")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={createModal.close}>
                Cancelar
              </Button>
              <Button type="submit" loading={create.isPending}>
                Criar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <EditModal
        category={editing}
        onClose={() => setEditing(null)}
        onSave={(name) =>
          editing && update.mutate({ id: editing.id, name })
        }
        loading={update.isPending}
      />
    </>
  );
}

function EditModal({
  category,
  onClose,
  onSave,
  loading,
}: {
  category: AdminCategory | null;
  onClose: () => void;
  onSave: (name: string) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <Modal
      opened={Boolean(category)}
      onClose={onClose}
      title="Editar categoria"
      centered
      // Remounting on open resets the field to the row that was clicked.
      key={category?.id}
    >
      <Stack gap="md">
        <TextInput
          label="Nome"
          defaultValue={category?.name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Text size="xs" c="dimmed">
          Chave: <Code>{category?.key}</Code> (não pode ser alterada)
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={loading}
            onClick={() => onSave(name || category?.name || "")}
          >
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
