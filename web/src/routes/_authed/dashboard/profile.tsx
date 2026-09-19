import { ProfileForm } from "@/modules/makers/components/profile-form/profile-form";
import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Stack p={"md"}>
      <ProfileForm />
    </Stack>
  );
}
