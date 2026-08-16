import { Button, Flex, Stack, Tooltip } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useSubmitForm } from "../../../hooks/use-submit-form";

export function StepLayout({ children }: PropsWithChildren) {
  const { isFist, isLast, next, previous, canProceed, submit, isPending } =
    useSubmitForm();
  return (
    <Stack mih={400} gap={"xs"} mt={"lg"}>
      {children}
      <Flex justify={"flex-end"} gap={"sm"} mt="auto">
        {!isFist && (
          <Button onClick={previous} variant="default" disabled={isPending}>
            Voltar
          </Button>
        )}
        {!isLast && (
          <Tooltip
            label="Preencha os campos obrigatórios para continuar"
            withArrow
            disabled={canProceed}
          >
            <Button onClick={next} disabled={!canProceed}>
              Proximo
            </Button>
          </Tooltip>
        )}
        {isLast && (
          <Button onClick={submit} loading={isPending}>
            Publicar Projeto
          </Button>
        )}
      </Flex>
    </Stack>
  );
}
