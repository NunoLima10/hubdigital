import { Hearder } from "@/modules/releases/components/hearder/hearder";
import { ReleasesList } from "@/modules/releases/components/releases-list/releases-list";
import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/releases")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Stack p={"md"}>
      <Hearder />
      <ReleasesList />
    </Stack>
  );
}
