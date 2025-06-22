import { Page } from "@/layouts/page";
import { ForceOnboarding } from "@/modules/onboarding/components/force-onboarding/force-onboarding";
import { Profile } from "@/modules/profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ForceOnboarding>
      <Page leftSection={<Profile />}>Dashboard</Page>;
    </ForceOnboarding>
  );
}
