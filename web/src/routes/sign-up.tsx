import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";
import { SignUpForm } from "@/modules/auth/components/sign-up-form/sign-up-form";

export const Route = createFileRoute("/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GuestGuard>
      <AuthPageLayout>
        <SignUpForm />
      </AuthPageLayout>
    </GuestGuard>
  );
}
