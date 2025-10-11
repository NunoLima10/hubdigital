import { SignedOut, useAuth, useClerk } from "@clerk/clerk-react";
import { Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

export function LoginButton() {
  const { isLoaded } = useAuth();
  const { openSignIn } = useClerk();

  return (
    <>
      <SignedOut>
        <Button
          onClick={() => openSignIn({})}
          leftSection={<IconUser size={18} />}
        >
          Login
        </Button>
      </SignedOut>
      {!isLoaded && (
        <Button leftSection={<IconUser size={18} />} loading>
          Login
        </Button>
      )}
    </>
  );
}
