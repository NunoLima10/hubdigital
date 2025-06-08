import { onBoardingQuestions } from "@/modules/onboarding/questions";
import { Radio, Select } from "@mantine/core";
import { StepLayout } from "../step-layout/step-layout";

const question = onBoardingQuestions[2];
const selectData = question.reponses.slice(0, 9).map((reponse) => {
  return { value: reponse.value, label: reponse.display };
});
const diasporaResponse = question.reponses[9];

export function UserLocation() {
  return (
    <StepLayout title={question.title}>
      <Select
        placeholder="Escolha sua ilha"
        data={selectData}
        searchable
        nothingFoundMessage="Nothing found..."
      />
      <Radio label={diasporaResponse.display} />
    </StepLayout>
  );
}
