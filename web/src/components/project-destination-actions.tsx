import { MessageSquare } from "lucide-react";
import { primaryProjectLink, projectLinkHref, projectLinkReferralHref, projectLinkActionLabel, projectLinkDisplayLabel, type ProjectLinkInput } from "@hubdigital/shared";
import { ProjectLinkIcon } from "./project-link-icon";

export function ProjectDestinationActions({ links, availability, onVisit, feedbackHref = "#project-comments" }: {
  links: ProjectLinkInput[]; availability?: string | null; onVisit?: (link: ProjectLinkInput) => void; feedbackHref?: string;
}) {
  const selected = primaryProjectLink(links);
  const primary = selected && (!["not_available", "unavailable"].includes(availability ?? "")
    || ["repository", "documentation", "demo"].includes(selected.kind)) ? selected : undefined;
  return (
    <div className="space-y-3">
      <a href={primary ? projectLinkReferralHref(primary)! : feedbackHref} target={primary ? "_blank" : undefined}
        rel={primary ? "noopener noreferrer" : undefined} onClick={primary ? () => onVisit?.(primary) : undefined}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/85">
        {primary ? <ProjectLinkIcon link={primary} /> : <MessageSquare className="size-4" />}
        {primary ? projectLinkActionLabel(primary, availability) : "Dar feedback"}
      </a>
      {links.filter((link) => link !== primary && projectLinkHref(link)).map((link, index) => (
        <a key={link.id ?? `${link.kind}-${index}`} href={projectLinkReferralHref(link)!} target="_blank" rel="noopener noreferrer"
          onClick={() => onVisit?.(link)} className="flex items-center gap-2 break-all text-sm text-primary hover:underline">
          <ProjectLinkIcon link={link} />{projectLinkDisplayLabel(link)}
        </a>
      ))}
    </div>
  );
}
