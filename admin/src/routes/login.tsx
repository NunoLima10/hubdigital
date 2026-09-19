import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStaffSession } from "@/lib/session";
import { AuthPageLayout } from "@/modules/auth/components/auth-page-layout/auth-page-layout";
import { SignInForm } from "@/modules/auth/components/sign-in-form/sign-in-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { session, isStaff, isPending } = useStaffSession();

  if (!isPending && session && isStaff) return <Navigate to="/" replace />;

  return (
    <AuthPageLayout>
      <SignInForm />
    </AuthPageLayout>
  );
}
