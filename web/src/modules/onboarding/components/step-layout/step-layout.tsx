import { Button, Flex, Stack, Text, Tooltip } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useOnboarding } from "../../hooks/use-onboarding";

type StepLayout = PropsWithChildren & {
  title: string;
};

export function StepLayout({ children, title }: StepLayout) {
  const { isFist, isLast, next, previous, needSelection } = useOnboarding();
  return (
    <Stack mih={400}  gap={"xs"} mt={"lg"}>
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
          <Tooltip label="Selecione uma opção para continuar" withArrow disabled={needSelection}>
            <Button disabled={!needSelection} onClick={next}>
              Proximo
            </Button>
          </Tooltip>
        )}
      </Flex>
    </Stack>
  );
}
