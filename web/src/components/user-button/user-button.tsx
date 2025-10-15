import { authClient } from "@/lib/auth-client";
import { Avatar, Group, Menu, Text, Title } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";

export function UserButton() {
  const { useSession, signOut } = authClient;
  const { data } = useSession();

  const user = data?.user;

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
      withinPortal
    >
      <Menu.Target>
        <Avatar src={user?.image} radius="xl" size={35}>
          TS
        </Avatar>
      </Menu.Target>
      <Menu.Dropdown>
        <Group py={"xs"} px={"md"} gap={0}>
          <Title order={4}>{user?.name}</Title>
          <Text c={"dimmed"}>{user?.email}</Text>
        </Group>
        <Menu.Divider />

        <Menu.Item
          onClick={() => signOut()}
          leftSection={<IconLogout size={16} />}
        >
          Terminar Sessão
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
