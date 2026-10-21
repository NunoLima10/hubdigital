import { helpWantedLabels, type Project } from "@hubdigital/shared";
export function ProjectProfile({
  project,
}: {
  project: Pick<Project, "languages" | "helpWanted" | "helpDescription" | "teamDescription">;
}) {
  const rows = [
    { label: "Línguas", value: project.languages.join(", ") },
    { label: "Equipa", value: project.teamDescription },
    {
      label: "Procura ajuda com",
      value: project.helpWanted.map((value) => helpWantedLabels[value]).join(", "),
    },
    { label: "Como podes ajudar", value: project.helpDescription },
  ];
  return (
    <>
      {rows
        .filter((row) => row.value)
        .map((row) => (
          <div key={row.label} className="py-2">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">{row.value}</dd>
          </div>
        ))}
    </>
  );
}
