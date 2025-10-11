import { Burger, Collapse, Flex, Stack } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { Profile } from "../profile/profile";
import { DashboardNav } from "../navbar/navbar";

export function SideBar() {
  const [opened, handlers] = useDisclosure(false);
  const smallScreen = useMediaQuery("(max-width: 88em)");

  return (
    <Stack>
      <Flex gap={"md"} justify={"space-between"} align={"center"}>
        <Profile />
        {smallScreen && <Burger opened={!opened} onClick={handlers.toggle} />}
      </Flex>
      <Collapse in={!opened || !smallScreen}>
        <DashboardNav />
      </Collapse>
    </Stack>
  );
}
