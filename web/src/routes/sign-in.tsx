import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";
import { SignInForm } from "@/modules/auth/components/sign-in-form/sign-in-form";

export const Route = createFileRoute("/sign-in")({
  // Depends on the visitor's session, and is worth nothing to a search engine:
  // rendered in the browser only.
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GuestGuard>
      <AuthPageLayout>
        <SignInForm />
      </AuthPageLayout>
    </GuestGuard>
  );
}
