import { useClerk } from "@clerk/clerk-react";
import { Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

export function LoginButton() {
  const { openSignIn, isSignedIn } = useClerk();
  if (isSignedIn) return null;

  return (
    <Button onClick={() => openSignIn({})} leftSection={<IconUser size={18} />}>
      Login
    </Button>
  );
}
