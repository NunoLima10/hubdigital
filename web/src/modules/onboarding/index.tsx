import { Page } from "@/layouts/page";
import { Center } from "@mantine/core";
import { useState } from "react";
import { QuestionStepper } from "./components/question-stepper/question-stepper";

export function Onboarding() {
  const [active, setActive] = useState(1);
  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  const [value, setValue] = useState("react");

  return (
    <Page>
      <Center h={"100vh"}>
        <QuestionStepper />

        {/* <Group justify="center" mt="xl">
          <Button variant="default" onClick={prevStep}>
            Back
          </Button>
          <Button onClick={nextStep}>Next step</Button>
        </Group> */}
      </Center>
    </Page>
  );
}
