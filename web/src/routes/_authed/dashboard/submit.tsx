import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { usePublicSettings } from "@/modules/settings/hooks/use-public-settings";
import SumbmitProvider from "@/modules/submit/context/sumbmit-form";
import { FormStepper } from "@/modules/submit/ui/container/form-stepper/form-stepper";
import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { z } from "zod";
import { useProject } from "@/modules/project-detail/hooks/use-project";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authed/dashboard/submit")({
  component: SubmitPage,
  validateSearch: z.object({ draft: z.string().min(1).optional() }),
});
function SubmitPage() {
  const { draft } = Route.useSearch();
  const { data: project, isLoading, isError } = useProject(draft);
  const { data: session } = authClient.useSession();
  const { data: settings } = usePublicSettings();
  if (settings && !settings["submissions.open"])
    return (
      <DashboardPage>
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <Wrench className="size-5" />
          <div>
            <strong>Submissões temporariamente fechadas</strong>
            <p>
              Estamos a preparar o próximo ciclo. Volta em breve para lançar o
              teu projeto.
            </p>
          </div>
        </div>
      </DashboardPage>
    );
  return (
    <DashboardPage>
      {draft && isLoading ? <p role="status">A carregar rascunho…</p> : draft && (isError || !project || project.author?.id !== session?.user.id || project.status === "published" || project.status === "pending")
        ? <p>Este rascunho não está disponível para edição aqui. Abre os teus projetos para continuar.</p>
        : <SumbmitProvider key={project?.id ?? "new"} project={project}>
            <FormStepper />
          </SumbmitProvider>}
    </DashboardPage>
  );
}
