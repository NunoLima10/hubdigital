import { Flex, Stepper } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
// import { useOnboarding } from "../../hooks/use-onboarding";
// import { StepCompleted } from "../step-completed/step-completed";
// import { UserInterest } from "../user-interest/user-interest";
// import { UserLocation } from "../user-location/user-location";
// import { UserOrigin } from "../user-origin/user-origin";
// import { UserProfile } from "../user-profile/user-profile";

import { IconCopyCheck, IconForms, IconList } from "@tabler/icons-react";
import { useSubmitForm } from "../../hooks/use-submit-form";
import { StepLayout } from "../step-layout/step-layout";
import classes from "./form-stepper.module.css";

export function FormStepper() {
  const matches = useMediaQuery("(min-width: 48em)");
  const { active } = useSubmitForm();

  return (
    <Flex className={classes.container}>
      <Stepper
        active={active}
        orientation={matches ? "horizontal" : "vertical"}
        className={classes.stepper}
      >
        <Stepper.Step
          label="Descrição"
          icon={<IconForms size={22} />}
          description={"Descreve teu projeto"}
        >
          <StepLayout title="1">1</StepLayout>
        </Stepper.Step>
        <Stepper.Step
          label="Categoria"
          icon={<IconList size={22} />}
          description="Enquadre teu projeto"
        >
          <StepLayout title="2">2</StepLayout>
        </Stepper.Step>
        <Stepper.Step
          label="Revisão"
          icon={<IconCopyCheck size={22} />}
          description="Revise tua publicação"
        >
          <StepLayout title="3">3</StepLayout>
        </Stepper.Step>
        <Stepper.Completed>validar</Stepper.Completed>
      </Stepper>
    </Flex>
  );
}
