import { PageHeader } from "@/components/page-header/page-header";
import { CommentsTable } from "@/modules/comments/components/comments-table/comments-table";
import { adminCommentStateValues } from "@hubdigital/shared";
import { Card, Group, Select, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_staff/comments")({
  component: RouteComponent,
});

const stateOptions = [
  { value: "", label: "Todos os estados" },
  ...adminCommentStateValues.map((state) => ({
    value: state,
    label: { visible: "Visível", hidden: "Ocultado", deleted: "Removido" }[
      state
    ],
  })),
];

function RouteComponent() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 300);
  const [state, setState] = useState("");

  return (
    <>
      <PageHeader
        title="Comentários"
        description="Ocultar é reversível e guarda o texto; remover deixa uma marca no lugar da conversa."
      />

      <Card withBorder padding="md">
        <CommentsTable
          search={debounced}
          state={(state || undefined) as never}
          filters={
            <Group gap="sm" wrap="wrap">
              <TextInput
                placeholder="Procurar no texto"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
              <Select
                data={stateOptions}
                value={state}
                onChange={(value) => setState(value ?? "")}
                w={180}
                allowDeselect={false}
              />
            </Group>
          }
        />
      </Card>
    </>
  );
}
