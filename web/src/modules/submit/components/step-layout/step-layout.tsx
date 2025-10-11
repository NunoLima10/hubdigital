import { Button, Flex, Stack, Text, Tooltip } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useSubmitForm } from "../../hooks/use-submit-form";

type StepLayout = PropsWithChildren & {
  title: string;
};

export function StepLayout({ children, title }: StepLayout) {
  const { isFist, isLast, next, previous } = useSubmitForm();
  return (
    <Stack mih={400} gap={"xs"} mt={"lg"}>
      <Text fw={500} fz={"h3"}>
        {title}
      </Text>
      <Stack />
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
