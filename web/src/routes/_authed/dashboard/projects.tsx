import { Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Text>Projetos</Text>;
}
