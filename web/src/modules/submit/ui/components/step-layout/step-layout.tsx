import { Button, Flex, Stack, Tooltip } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useSubmitForm } from "../../../hooks/use-submit-form";

export function StepLayout({ children }: PropsWithChildren) {
  const { isFist, isLast, next, previous } = useSubmitForm();
  return (
    <Stack mih={400} gap={"xs"} mt={"lg"}>
      {children}
      <Flex justify={"flex-end"} gap={"sm"} mt="auto">
        {!isFist && (
          <Button onClick={previous} variant="default">
            Voltar
          </Button>
        )}
        {!isLast && (
          <Tooltip
            label="Selecione uma opção para continuar"
            withArrow
            disabled={true}
          >
            <Button onClick={next}>Proximo</Button>
          </Tooltip>
        )}
      </Flex>
    </Stack>
  );
}
