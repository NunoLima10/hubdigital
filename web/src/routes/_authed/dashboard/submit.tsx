import { usePublicSettings } from "@/modules/settings/hooks/use-public-settings";
import SumbmitProvider from "@/modules/submit/context/sumbmit-form";
import { FormStepper } from "@/modules/submit/ui/container/form-stepper/form-stepper";
import { Alert, Stack } from "@mantine/core";
import { IconTool } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/submit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: settings } = usePublicSettings();

  // The API refuses the submission anyway; this is so the maker finds out
  // before filling in five steps of a form.
  if (settings && !settings["submissions.open"]) {
    return (
      <Alert
        variant="light"
        color="yellow"
        icon={<IconTool size={18} />}
        title="Submissões temporariamente fechadas"
      >
        Estamos a preparar o próximo ciclo. Volte em breve para lançar o seu
        projeto.
      </Alert>
    );
  }

  return (
    <Stack>
      <SumbmitProvider>
        <FormStepper></FormStepper>
      </SumbmitProvider>
    </Stack>
  );
}
