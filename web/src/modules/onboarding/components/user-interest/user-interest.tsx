import { onBoardingQuestions } from "@/modules/onboarding/questions";
import { Radio, Stack } from "@mantine/core";
import { useOnboarding } from "../../hooks/use-onboarding";
import { RadioCard } from "../radio-card/radio-card";
import { StepLayout } from "../step-layout/step-layout";

const question = onBoardingQuestions[1];

export function UserInterest() {
  const { form } = useOnboarding();

  return (
    <StepLayout title={question.title}>
      <Radio.Group {...form.getInputProps("objectiveResponse")} key={form.key("objectiveResponse")}>
        <Stack>
          {question.reponses.map((reponse, index) => {
            return (
              <RadioCard
                value={reponse.value}
                label={reponse.display}
                key={index}
              />
            );
          })}
        </Stack>
      </Radio.Group>
    </StepLayout>
  );
}
