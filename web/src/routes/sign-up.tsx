import { privatePageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { GuestGuard } from "@/modules/auth/components/guest-guard/guest-guard";
import { SignUpForm } from "@/modules/auth/components/sign-up-form/sign-up-form";
import { authRedirectSearchSchema } from "@/modules/auth/utils/redirect";

export const Route = createFileRoute("/sign-up")({
  head: () => privatePageHead("Criar conta"),
  // Carried back to "Iniciar sessão"; new accounts still go through onboarding.
  validateSearch: authRedirectSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect } = Route.useSearch();
  return (
    <GuestGuard>
      <AuthPageLayout>
        <SignUpForm signInRedirect={redirect} />
      </AuthPageLayout>
    </GuestGuard>
  );
}
