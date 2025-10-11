import { SignIn } from "@clerk/clerk-react";
import { Center } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
  component: Page,
});

function Page() {
  return (
    <Center>
      <SignIn />
    </Center>
  );
}
