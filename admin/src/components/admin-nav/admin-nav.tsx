import { Badge, Space, Stack } from "@mantine/core";
import {
  IconClipboardCheck,
  IconFlag,
  IconHistory,
  IconLayoutGrid,
  IconMessage,
  IconRocket,
  IconSettings,
  IconTags,
  IconUsers,
} from "@tabler/icons-react";
import { NavLink } from "../nav-link/nav-link";

export function AdminNav() {
  return (
    <Stack gap="xxs">
      <Badge c="dimmed" variant="transparent">
        MODERAÇÃO
      </Badge>
      <Stack gap="xxs">
        <NavLink
          to="/"
          title="Visão geral"
          icon={<IconLayoutGrid size={18} />}
        />
        <NavLink
          to="/queue"
          title="Fila de revisão"
          icon={<IconClipboardCheck size={18} />}
        />
        <NavLink
          to="/projects"
          title="Projetos"
          icon={<IconRocket size={18} />}
        />
        <NavLink
          to="/comments"
          title="Comentários"
          icon={<IconMessage size={18} />}
        />
        <NavLink
          to="/reports"
          title="Relatórios"
          icon={<IconFlag size={18} />}
        />
      </Stack>

      <Space h="sm" />

      <Badge c="dimmed" variant="transparent">
        PLATAFORMA
      </Badge>
      <Stack gap="xxs">
        <NavLink
          to="/users"
          title="Utilizadores"
          icon={<IconUsers size={18} />}
        />
        <NavLink
          to="/categories"
          title="Categorias"
          icon={<IconTags size={18} />}
        />
        <NavLink
          to="/audit"
          title="Auditoria"
          icon={<IconHistory size={18} />}
        />
        <NavLink
          to="/settings"
          title="Definições"
          icon={<IconSettings size={18} />}
        />
      </Stack>
    </Stack>
  );
}
