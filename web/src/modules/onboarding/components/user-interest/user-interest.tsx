import { onBoardingQuestions } from "@/modules/onboarding/questions";
import { Radio, Stack } from "@mantine/core";
import { RadioCard } from "../radio-card/radio-card";
import { StepLayout } from "../step-layout/step-layout";

const question = onBoardingQuestions[1];

export function UserInterest() {
  return (
    <StepLayout title={question.title}>
      <Radio.Group>
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
