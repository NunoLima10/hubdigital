import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/preferences")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/profile", replace: true });
  },
});
