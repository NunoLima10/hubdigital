import { Page } from "@/layouts/page";
import { Center } from "@mantine/core";
import { useState } from "react";
import { QuestionStepper } from "./components/question-stepper/question-stepper";
import OnboardingProvider from "./contexts/onboarding";

export function Onboarding() {

  return (
    <OnboardingProvider>
      <Page>
        <Center h={"100vh"}>
          <QuestionStepper />
        </Center>
      </Page>
    </OnboardingProvider>
  );
}
