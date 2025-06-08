import { useContext } from "react";
import { OnboardingContext } from "../contexts/onboarding";

export function useOnboarding() {
  const onboardingContext = useContext(OnboardingContext);

  if (!onboardingContext) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return onboardingContext;
}
