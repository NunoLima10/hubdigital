import { Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { SignedOut } from "../signed-out/signed-out";

export function LoginButton() {
  return (
    <SignedOut>
      <Button component={Link} to="/sign-in" leftSection={<IconUser size={18} />}>
        Login
      </Button>
    </SignedOut>
  );
}
