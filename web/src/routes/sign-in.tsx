import { privatePageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";
import { SignInForm } from "@/modules/auth/components/sign-in-form/sign-in-form";
import { authRedirectSearchSchema } from "@/modules/auth/utils/redirect";

export const Route = createFileRoute("/sign-in")({
  head: () => privatePageHead("Iniciar sessão"),
  // ?redirect=/projects/x sends the visitor back there once signed in.
  validateSearch: authRedirectSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect } = Route.useSearch();
  return (
    <GuestGuard redirectTo={redirect}>
      <AuthPageLayout>
        <SignInForm redirectTo={redirect} />
      </AuthPageLayout>
    </GuestGuard>
  );
}
