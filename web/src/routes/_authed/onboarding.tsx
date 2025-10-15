import { Page } from "@/layouts/page";
import { authClient } from "@/lib/auth-client";
import { QuestionStepper } from "@/modules/onboarding/components/question-stepper/question-stepper";
import OnboardingProvider from "@/modules/onboarding/contexts/onboarding";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const { useSession } = authClient;
  const { data } = useSession();

  // @ts-ignore
  const onboarded = data?.user.onboardedAt;

  if (onboarded) return <Navigate to={"/dashboard/releases"} replace />;

  return (
    <OnboardingProvider>
      <Page>
        <QuestionStepper />
      </Page>
    </OnboardingProvider>
  );
}
