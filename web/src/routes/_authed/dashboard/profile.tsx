import { ProfileForm } from "@/modules/makers/components/profile-form/profile-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4">
      <ProfileForm />
    </div>
  );
}
