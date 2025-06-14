import { Button, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../hooks/use-onboarding";
import { StepLayout } from "../step-layout/step-layout";

export function StepCompleted() {

  const { submit, isPending } = useOnboarding();

  return (
    <StepLayout title={""}>
      <Title mt={"lg"} ta={"center"}>
        Seja bem-vindo!
      </Title>
      <Text ta={"center"} size="lg" mb="md" mx={"auto"} maw={500}>
        Agora, você pode descobrir, compartilhar e apoiar projetos feitos por
        caboverdianos para caboverdianos.
      </Text>
      <Stack align="center" justify="center">
        <Button onClick={submit} loading={isPending}>
          Entrar no Hub digital
        </Button>
      </Stack>
    </StepLayout>
  );
}
