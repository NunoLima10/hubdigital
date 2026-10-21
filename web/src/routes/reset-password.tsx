import { seo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";
import { ResetPassword } from "@/modules/auth/components/reset-password/reset-password";

export const Route = createFileRoute("/reset-password")({
  head: () => seo({ title: "Nova password", noIndex: true }),
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
