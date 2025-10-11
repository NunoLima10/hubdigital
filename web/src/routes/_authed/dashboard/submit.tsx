import { FormStepper } from "@/modules/submit/components/form-stepper/form-stepper";
import SumbmitProvider from "@/modules/submit/context/sumbmit-form";
import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/submit")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Stack>
      <SumbmitProvider>
        <FormStepper></FormStepper>
      </SumbmitProvider>
    </Stack>
  );
}
