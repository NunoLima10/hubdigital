import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { ForgotPassword } from "@/modules/auth/components/forgot-password/forgot-password";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";

export const Route = createFileRoute("/forgot-password")({
  head: () => seo({ title: "Recuperar password", noIndex: true }),
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
