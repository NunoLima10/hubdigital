import { createFileRoute } from "@tanstack/react-router";
import { renderSitemap } from "@/lib/sitemap";
import { projectPath } from "@/modules/project-detail/seo";
import { fetchAllPublishedProjects } from "@/modules/project-list/hooks/use-projects";
import { parseApiDate } from "@/utils/api-date";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Static pages still go out if the API is down; the project list is a
        // bonus on top, not a reason to fail the whole sitemap.
        const projects = await fetchAllPublishedProjects().catch(() => []);
        const xml = renderSitemap([
          { path: "/" },
          { path: "/map" },
          ...projects.map((project) => ({
            path: projectPath(project.slug),
            lastModified: parseApiDate(project.launchedAt ?? project.createdAt),
          })),
        ]);
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
