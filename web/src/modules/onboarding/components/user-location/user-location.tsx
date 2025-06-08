import { onBoardingQuestions } from "@/modules/onboarding/questions";
import { Checkbox, Select } from "@mantine/core";
import { useOnboarding } from "../../hooks/use-onboarding";
import { StepLayout } from "../step-layout/step-layout";

const question = onBoardingQuestions[2];
const selectData = question.reponses.slice(0, 9).map((reponse) => {
  return { value: reponse.value, label: reponse.display };
});
const diasporaResponse = question.reponses[9];

export function UserLocation() {
  const { form, isDispora, onSelectDispora } = useOnboarding();

  function onChangeIsland(value: string | null) {
    if (value) {
      form.setFieldValue(
        "locationResponse",
        value as typeof form.values.locationResponse
      );
    }
  }

  return (
    <StepLayout title={question.title}>
      <Select
        placeholder="Escolha sua ilha"
        data={selectData}
        searchable
        nothingFoundMessage="Nothing found..."
        value={form.values.locationResponse}
        onChange={onChangeIsland}

        disabled={isDispora}
      />
      <Checkbox
        checked={isDispora}
        onChange={onSelectDispora}
        label={diasporaResponse.display}
      />
    </StepLayout>
  );
}
