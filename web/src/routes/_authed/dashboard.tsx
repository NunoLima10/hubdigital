import { Page } from "@/layouts/page";
import { Profile } from "@/modules/profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Page leftSection={<Profile />}>Dashboard</Page>;
}
