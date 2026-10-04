import type { Project } from "@/modules/submit/types/project";
import { EyeOff, TriangleAlert } from "lucide-react";

export function ModerationNotice({ project }: { project: Project }) {
  if (project.hidden)
    return (
      <div
        role="alert"
        className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        <EyeOff className="size-5 shrink-0" />
        <div>
          <strong>Este projeto está oculto</strong>
          <p>
            Não aparece no site nem nos rankings. Motivo:{" "}
            <b>{project.hiddenReason ?? "não indicado"}</b>. Fala com a equipa
            se achares que houve um engano.
          </p>
        </div>
      </div>
    );
  if (project.status === "rejected" && project.rejectionReason)
    return (
      <div
        role="alert"
        className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <TriangleAlert className="size-5 shrink-0" />
        <div>
          <strong>Precisa de alterações</strong>
          <p>
            {project.rejectionReason} Corrige e volta a publicar para entrar de
            novo na fila.
          </p>
        </div>
      </div>
    );
  return null;
}
