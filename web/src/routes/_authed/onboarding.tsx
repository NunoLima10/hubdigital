import { Page } from "@/layouts/page";
import { authClient } from "@/lib/auth-client";
import { QuestionStepper } from "@/modules/onboarding/components/question-stepper/question-stepper";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const { useSession } = authClient;
  const { data } = useSession();

  const onboarded =
    data?.user && "onboardedAt" in data.user ? data.user.onboardedAt : null;

  if (onboarded) return <Navigate to={"/dashboard/releases"} replace />;

  return (
    <Page>
      <QuestionStepper />
    </Page>
  );
}
