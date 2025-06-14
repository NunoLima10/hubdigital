import { Flex, Stepper, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useOnboarding } from "../../hooks/use-onboarding";
import { StepCompleted } from "../step-completed/step-completed";
import { UserInterest } from "../user-interest/user-interest";
import { UserLocation } from "../user-location/user-location";
import { UserOrigin } from "../user-origin/user-origin";
import { UserProfile } from "../user-profile/user-profile";
import classes from "./question-stepper.module.css";

export function QuestionStepper() {
  const { active } = useOnboarding();
  const matches = useMediaQuery("(min-width: 48em)");

  return (
    <Flex className={classes.container}>
      <Stepper
        active={active}
        orientation={matches ? "horizontal" : "vertical"}
        className={classes.stepper}
      >
        <Stepper.Step label="Sobre você" description="Perfil do usuário">
          <UserProfile />
        </Stepper.Step>
        <Stepper.Step label="Seu objetivo" description="Interesse do usuário">
          <UserInterest />
        </Stepper.Step>
        <Stepper.Step
          label="Sua localização"
          description="Localização do usuário"
        >
          <UserLocation />
        </Stepper.Step>
        <Stepper.Step label="Como nos conheceu" description="Origem do usuário">
          <UserOrigin />
        </Stepper.Step>
        <Stepper.Completed>
          <StepCompleted />
        </Stepper.Completed>
      </Stepper>
    </Flex>
  );
}
