import { useClerk, useUser } from "@clerk/react-router";
import { Avatar, Group, Menu, Skeleton, Text, Title } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";

export function UserButton() {
  const { signOut } = useClerk();
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) return <Skeleton circle w={35} h={35} />;

  if (!isSignedIn) return null;

  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
      withinPortal
    >
      <Menu.Target>
        <Avatar src={user?.imageUrl} radius="xl" size={35}>
          TS
        </Avatar>
      </Menu.Target>
      <Menu.Dropdown>
        <Group py={"xs"} px={"md"} gap={0}>
          <Title order={4}>{user?.fullName}</Title>
          <Text c={"dimmed"}>{user?.emailAddresses.toString()}</Text>
        </Group>
        <Menu.Divider />

        <Menu.Item
          onClick={() => signOut({})}
          leftSection={<IconLogout size={16} />}
        >
          Terminar Sessão
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
