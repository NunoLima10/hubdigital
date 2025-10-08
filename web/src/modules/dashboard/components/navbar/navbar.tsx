import { Badge, Space, Stack } from "@mantine/core";

import {
  IconChartBarPopular,
  IconHeart,
  IconRocket,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { NavLink } from "../nav-link/nav-link";

export function DashboardNav() {
  return (
    <Stack gap={"xxs"}>
      <Badge c={"dimmed"} variant="transparent">
        WORKSPACE
      </Badge>
      <Stack gap={"xxs"}>
        <NavLink
          to="/dashboard/projects"
          title="Projetos"
          icon={<IconRocket size={18} />}
        />
        <NavLink
          to="/onboarding"
          title="Metricas"
          icon={<IconChartBarPopular size={18} />}
        />
      </Stack>
      <Space h={"sm"}></Space>
      <Badge c={"dimmed"} variant="transparent">
        Minha conta
      </Badge>
      <Stack gap={"xxs"}>
        <NavLink
          to="/onboarding"
          title="Perfil"
          icon={<IconUser size={18} />}
        />
        <NavLink
          to="/onboarding"
          title="Favoritos"
          icon={<IconHeart size={18} />}
        />
        <NavLink
          to="/onboarding"
          title="Configurações"
          icon={<IconSettings size={18} />}
        />
      </Stack>
    </Stack>
  );
}
