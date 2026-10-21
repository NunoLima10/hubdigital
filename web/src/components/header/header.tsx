import { SUBMIT_URL } from "@/data";
import { Button, Group, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { GithubStars } from "../github-starts/github-starts";
import { ToggleShemeButton } from "../toggle-sheme-button/toggle-sheme-button";
import classes from "./header.module.css";

export function Header() {
  return (
    <header className={classes.header}>
      <Link to="/" className={classes.logo}>
        <Text fw={800}>HubDigital</Text>
      </Link>
      <Group gap="xs">
        <GithubStars />
        <ToggleShemeButton />
        <Button
          component="a"
          href={SUBMIT_URL}
          target="_blank"
          leftSection={<IconPlus size={18} />}
          visibleFrom="xs"
        >
          Submeter
        </Button>
      </Group>
    </header>
  );
}
