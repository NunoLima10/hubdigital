import { Button, Group } from "@mantine/core";
import { ToggleShemeButton } from "../toggle-sheme-button/toggle-sheme-button";
import classes from "./header.module.css";
import { IconUser } from "@tabler/icons-react";
import { GithubStars } from "../github-starts/github-starts";

export function Header() {
  return (
    <div className={classes.header}>
      logo aqui
      <Group>
        <GithubStars/>
        <ToggleShemeButton />
        <Button leftSection={<IconUser size={18}/>}>Login</Button>
      </Group>
    </div>
  );
}
