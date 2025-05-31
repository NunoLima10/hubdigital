import { Group } from "@mantine/core";
import { GithubStars } from "../github-starts/github-starts";
import { LoginButton } from "../login-button/login-button";
import { ToggleShemeButton } from "../toggle-sheme-button/toggle-sheme-button";
import { UserButton } from "../user-button/user-button";
import classes from "./header.module.css";

export function Header() {
  return (
    <div className={classes.header}>
      logo aqui
      <Group>
        <GithubStars />
        <ToggleShemeButton />
        <LoginButton />
        <UserButton />
      </Group>
    </div>
  );
}
