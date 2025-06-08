import { Button, Flex, Stack, Text } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useOnboarding } from "../../hooks/use-onboarding";

type StepLayout = PropsWithChildren & {
  title: string;
};

export function StepLayout({ children, title }: StepLayout) {
  const { isFist, isLast, next, previous, needSelection } = useOnboarding();
  return (
    <Stack mih={400} p={"md"}>
      <Text ta={"center"} fw={500} fz={"h2"}>
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
        {!isLast && <Button disabled={!needSelection} onClick={next}>Proximo</Button>}
      </Flex>
    </Stack>
  );
}
