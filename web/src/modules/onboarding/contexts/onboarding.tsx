
import { createContext, PropsWithChildren } from "react";

type OnboardingContextType = {};

export const OnboardingContext = createContext<
  OnboardingContextType | undefined
>(undefined);

function OnboardingProvider({ children }: PropsWithChildren) {
  const value = {};
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export default OnboardingProvider;
