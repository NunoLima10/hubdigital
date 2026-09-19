import { AdminNav } from "@/components/admin-nav/admin-nav";
import { ToggleShemeButton } from "@/components/toggle-sheme-button/toggle-sheme-button";
import { authClient } from "@/lib/auth-client";
import { useStaffSession } from "@/lib/session";
import {
  AppShell,
  Badge,
  Burger,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLogout, IconShieldLock } from "@tabler/icons-react";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_staff")({
  component: StaffLayout,
});

function StaffLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { session, isStaff, isPending, error } = useStaffSession();

  if (isPending) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (error || !session) return <Navigate to="/login" replace />;

  // Convenience only. Every /v1/admin route enforces the same rule server-side;
  // this just avoids rendering a shell the API would reject on every request.
  if (!isStaff) return <NoAccess />;

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <Title order={4}>HubDigital</Title>
              <Badge color="red" variant="light">
                ADMIN
              </Badge>
            </Group>
          </Group>
          <Group gap="xs">
            <ToggleShemeButton />
            <AccountMenu name={session.user.name} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AdminNav />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function AccountMenu({ name }: { name: string }) {
  const navigate = useNavigate();

  return (
    <Menu position="bottom-end" withArrow>
      <Menu.Target>
        <Button variant="subtle" size="compact-sm">
          {name}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={async () => {
            await authClient.signOut();
            navigate({ to: "/login" });
          }}
        >
          Terminar sessão
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function NoAccess() {
  const navigate = useNavigate();

  return (
    <Center h="100vh" p="md">
      <Card withBorder padding="xl" w={420} maw="100%">
        <Stack gap="md" align="center">
          <IconShieldLock size={40} />
          <Title order={4}>Sem permissão</Title>
          <Text size="sm" c="dimmed" ta="center">
            Você não possui permissão para aceder a este recurso. Esta área é
            restrita à equipa do HubDigital.
          </Text>
          <Button
            variant="light"
            onClick={async () => {
              await authClient.signOut();
              navigate({ to: "/login" });
            }}
          >
            Terminar sessão
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
