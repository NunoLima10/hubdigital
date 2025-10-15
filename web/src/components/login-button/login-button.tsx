import { Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { SignedOut } from "../signed-out/signed-out";

export function LoginButton() {
  const { signIn } = authClient;
  const { useSession } = authClient;
  const [isloading, setIsloading] = useState(false);

  async function handelLoginDemo() {
    setIsloading(true);
    await signIn.email({
      email: "demo.publisher@hubdigital.cv",
      password: "demo1234",
    });
    setIsloading(false);
  }

  return (
    <SignedOut>
      <Button
        onClick={handelLoginDemo}
        leftSection={<IconUser size={18} />}
        loading={isloading}
      >
        Login
      </Button>
    </SignedOut>
  );
}
