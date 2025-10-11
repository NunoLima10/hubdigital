import { Page } from "@/layouts/page";
import { QuestionStepper } from "@/modules/onboarding/components/question-stepper/question-stepper";
import OnboardingProvider from "@/modules/onboarding/contexts/onboarding";
import { useUser } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useUser();

  const onboarded = user?.publicMetadata?.onboarded;
  if (onboarded) return <Navigate to={"/dashboard"} replace />;

  return (
    <OnboardingProvider>
      <Page>
        <QuestionStepper />
      </Page>
    </OnboardingProvider>
  );
}
