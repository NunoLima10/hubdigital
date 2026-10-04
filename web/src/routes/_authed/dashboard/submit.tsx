import { usePublicSettings } from "@/modules/settings/hooks/use-public-settings";
import SumbmitProvider from "@/modules/submit/context/sumbmit-form";
import { FormStepper } from "@/modules/submit/ui/container/form-stepper/form-stepper";
import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard/submit")({
  component: SubmitPage,
});
function SubmitPage() {
  const { data: settings } = usePublicSettings();
  if (settings && !settings["submissions.open"])
    return (
      <div
        role="status"
        className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        <Wrench className="size-5" />
        <div>
          <strong>Submissões temporariamente fechadas</strong>
          <p>
            Estamos a preparar o próximo ciclo. Volta em breve para lançar o teu
            projeto.
          </p>
        </div>
      </div>
    );
  return (
    <SumbmitProvider>
      <FormStepper />
    </SumbmitProvider>
  );
}
