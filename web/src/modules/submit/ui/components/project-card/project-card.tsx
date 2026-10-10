import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge } from "@/components/ui/badge";
export function ProjectCard({
  name,
  iconUrl,
  websiteUrl,
  description,
  badges = [],
}: {
  name: string;
  iconUrl?: string;
  websiteUrl: string;
  description: string;
  badges?: string[];
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-4">
      <ProjectIcon iconUrl={iconUrl} className="size-14" />
      <div>
        <a
          href={websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold hover:underline"
        >
          {name}
        </a>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <Badge key={badge}>{badge}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
