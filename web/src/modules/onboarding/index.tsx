import { Page } from "@/layouts/page";
import { QuestionStepper } from "./components/question-stepper/question-stepper";
import OnboardingProvider from "./contexts/onboarding";
import { useUser } from "@clerk/react-router";
import { Navigate } from "react-router-dom";
import { PathConstants } from "@/app/router";

export function Onboarding() {
     const { user } = useUser();

   const onboarded = user?.publicMetadata?.onboarded;
    if (onboarded) return <Navigate to={PathConstants.profile} replace />;

  return (
    <OnboardingProvider>
      <Page>
        <QuestionStepper />
      </Page>
    </OnboardingProvider>
  );
}
