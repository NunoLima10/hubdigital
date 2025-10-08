import { ToggleShemeButton } from "@/components/toggle-sheme-button/toggle-sheme-button";
import { UserButton } from "@/components/user-button/user-button";
import { Button, Flex, Group } from "@mantine/core";
import { IconGps } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import classes from "./header.module.css";

export function DashboardHeader() {
  const navigate = useNavigate();

  function goToHome() {
    navigate({ to: "/" });
  }

  return (
    <Flex className={classes.container}>
      logo aqui
      <Group>
        <ToggleShemeButton />
        <Button leftSection={<IconGps size={18} />} onClick={goToHome}>
          Explorar
        </Button>
      </Group>
    </Flex>
  );
}
