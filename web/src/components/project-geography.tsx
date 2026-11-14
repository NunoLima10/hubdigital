import {
  countryLabels,
  formatLocation,
  localConnectionLabels,
  type Project,
} from "@hubdigital/shared";
export function ProjectGeography({
  project,
}: {
  project: Pick<
    Project,
    "location" | "additionalLocations" | "teamMode" | "serviceArea" | "localConnections"
  >;
}) {
  const bases = [project.location, ...project.additionalLocations].filter(Boolean);
  const rows = [
    { label: "Equipa", value: project.teamMode === "distributed" ? "Distribuída" : "" },
    {
      label: bases.length > 1 ? "Bases do projeto" : "Base do projeto",
      value: bases.map((location) => (location ? formatLocation(location) : "")).join("; "),
    },
    {
      label: "Pode ser usado",
      value:
        project.serviceArea?.scope === "worldwide"
          ? "Em todo o mundo"
          : project.serviceArea?.countries.map((code) => countryLabels[code]).join(", "),
    },
    {
      label: "Ligação a Cabo Verde",
      value: project.localConnections.map((code) => localConnectionLabels[code]).join(", "),
    },
  ];
  return (
    <>
      {rows
        .filter((row) => row.value)
        .map((row) => (
          <div key={row.label} className="py-2">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="mt-1 text-sm">{row.value}</dd>
          </div>
        ))}
    </>
  );
}
