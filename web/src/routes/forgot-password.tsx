import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { ForgotPassword } from "@/modules/auth/components/forgot-password/forgot-password";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";

export const Route = createFileRoute("/forgot-password")({
  // Depends on the visitor's session, and is worth nothing to a search engine:
  // rendered in the browser only.
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GuestGuard>
      <AuthPageLayout>
        <ForgotPassword />
      </AuthPageLayout>
    </GuestGuard>
  );
}
