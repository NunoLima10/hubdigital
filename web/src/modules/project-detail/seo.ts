import { env } from "@/app/env";
import { absoluteUrl, jsonLd, seo } from "@/lib/seo";
import type { Project } from "@/modules/submit/types/project";
import { parseApiDate } from "@/utils/api-date";

export function projectPath(slug: string) {
  return `/projects/${encodeURIComponent(slug)}`;
}

/**
 * The project's Open Graph card, rendered by the API. The version mirrors the
 * API's cache key — an edit or a new vote changes the URL, which is the only
 * way to make WhatsApp or Facebook drop a card they have already cached.
 */
export function projectShareImageUrl(
  project: Pick<Project, "slug" | "updatedAt" | "upvoteCount">,
) {
  const updated = parseApiDate(project.updatedAt)?.getTime() ?? 0;
  const version = `${updated}-${project.upvoteCount}`;
  return `${env.API_URL}/share-images/projects/${encodeURIComponent(project.slug)}?v=${version}`;
}

function projectStructuredData(project: Project) {
  return jsonLd({
    "@type": "SoftwareApplication",
    name: project.name,
    description: project.shortDescription,
    url: absoluteUrl(projectPath(project.slug)),
    image: project.galleryImageUrls[0] || project.logoUrl || undefined,
    applicationCategory: project.category?.name,
    author: project.author ? { "@type": "Person", name: project.author.name } : undefined,
    datePublished: parseApiDate(project.publishedAt)?.toISOString(),
  });
}

/**
 * Head tags for /projects/$slug. The server fetches anonymously, so a draft
 * looks missing here even to its owner, whose browser then loads it. A 404
 * status would break that preview, so a missing project is only kept out of
 * the index.
 */
export function projectHead(project: Project | undefined, slug: string) {
  if (!project || project.status !== "published") {
    return seo({ title: "Projeto", path: projectPath(slug), noIndex: true });
  }
  return {
    ...seo({
      title: project.name,
      description: project.shortDescription,
      path: projectPath(project.slug),
      image: projectShareImageUrl(project),
      imageAlt: `${project.name} no Hub Digital`,
      type: "article",
    }),
    scripts: [projectStructuredData(project)],
  };
}
