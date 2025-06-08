import { Stepper } from "@mantine/core";
import { useState } from "react";
import { UserInterest } from "../user-interest/user-interest";
import { UserLocation } from "../user-location/user-location";
import { UserOrigin } from "../user-origin/user-origin";
import { UserProfile } from "../user-profile/user-profile";

export function QuestionStepper() {
  const [active, setActive] = useState(1);
  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  return (
    <Stepper active={4} onStepClick={setActive}>
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
        Cadastro concluído! Clique em voltar para revisar as etapas anteriores.
      </Stepper.Completed>
    </Stepper>
  );
}
