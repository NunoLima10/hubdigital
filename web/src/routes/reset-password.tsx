import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";
import { ResetPassword } from "@/modules/auth/components/reset-password/reset-password";

export const Route = createFileRoute("/reset-password")({
  // Depends on the visitor's session, and is worth nothing to a search engine:
  // rendered in the browser only.
  ssr: false,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <GuestGuard>
      <AuthPageLayout>
        <ResetPassword />
      </AuthPageLayout>
    </GuestGuard>
  );
}
