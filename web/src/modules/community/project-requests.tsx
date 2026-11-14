import {
  helpWantedLabels,
  isLookingForCollaborators,
  type Project,
} from "@hubdigital/shared";

export function ProjectRequests({
  project,
}: {
  project: Pick<Project, "helpWanted" | "helpDescription">;
}) {
  if (!project.helpWanted.length && !project.helpDescription) return null;
  return (
    <section
      aria-labelledby="project-requests-title"
      className="space-y-3 border-t pt-5"
    >
      <h2 id="project-requests-title" className="text-sm font-semibold">
        Como podes ajudar
      </h2>
      {isLookingForCollaborators(project.helpWanted) && (
        <p className="text-xs font-medium text-primary">
          Procura colaboradores
        </p>
      )}
      <ul className="flex flex-wrap gap-2">
        {project.helpWanted.map((value) => (
          <li
            key={value}
            className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground"
          >
            {helpWantedLabels[value]}
          </li>
        ))}
      </ul>
      {project.helpDescription && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {project.helpDescription}
        </p>
      )}
    </section>
  );
}
