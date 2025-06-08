import { Button } from "@mantine/core";
import { useOnboarding } from "../../hooks/use-onboarding";
import { StepLayout } from "../step-layout/step-layout";

export function StepCompleted() {
  const { submit } = useOnboarding();
  return (
    <StepLayout title={""}>
      <Button onClick={submit}>Entar com tudo</Button>
    </StepLayout>
  );
}
