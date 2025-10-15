import { Button, Group, Skeleton } from "@mantine/core";

import { useNavigate } from "@tanstack/react-router";
import { GithubStars } from "../github-starts/github-starts";
import { LoginButton } from "../login-button/login-button";
import { SignedIn } from "../signed-in/signed-in";
import { ToggleShemeButton } from "../toggle-sheme-button/toggle-sheme-button";
import { UserButton } from "../user-button/user-button";
import classes from "./header.module.css";

export function Header() {
  const navigate = useNavigate();

  function goToDashboard() {
    navigate({ to: "/dashboard/releases" });
  }

  return (
    <div className={classes.header}>
      logo aqui
      <Group>
        <GithubStars />
        <ToggleShemeButton />
        <SignedIn>
          <Button onClick={goToDashboard}>Dashboard</Button>
          <UserButton />
        </SignedIn>

        {/* <SignedIn fallback={<Skeleton circle w={35} h={35} />}>
          <UserButton />
        </SignedIn> */}

        <LoginButton />
      </Group>
    </div>
  );
}
