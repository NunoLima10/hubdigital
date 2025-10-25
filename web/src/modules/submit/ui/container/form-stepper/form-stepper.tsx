import { Flex, Stepper } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { IconCopyCheck, IconForms, IconList } from "@tabler/icons-react";
import { useSubmitForm } from "../../../hooks/use-submit-form";
import { StepLayout } from "../../components/step-layout/step-layout";
import { ProjectCategories } from "../project-categories/project-categories";
import { ProjectForm } from "../project-form/project-form";
import { ProjectReview } from "../project-review/project-review";
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
        classNames={{ stepIcon: classes.stepIcon }}
      >
        <Stepper.Step
          label="Descrição"
          icon={<IconForms size={22} />}
          description={"Descreve teu projeto"}
        >
          <StepLayout>
            <ProjectForm />
          </StepLayout>
        </Stepper.Step>
        <Stepper.Step
          label="Categoria"
          icon={<IconList size={22} />}
          description="Enquadre teu projeto"
        >
          <StepLayout>
            <ProjectCategories />
          </StepLayout>
        </Stepper.Step>
        <Stepper.Step
          label="Revisão"
          icon={<IconCopyCheck size={22} />}
          description="Revise tua publicação"
        >
          <StepLayout>
            <ProjectReview />
          </StepLayout>
        </Stepper.Step>
        <Stepper.Completed>validar</Stepper.Completed>
      </Stepper>
    </Flex>
  );
}
