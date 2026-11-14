import type { DB } from "@/db";
import { projects, projectLinks } from "@/db/schemas";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import {
  normalizedProjectLink,
  type ProjectLinkInput,
} from "@hubdigital/shared";
import { publicProjectConditions } from "./project-visibility";
import { ProjectPublicationError } from "./project-publication";

type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** Publication and live edits share a lock, so two drafts cannot claim a URL at once. */
export async function lockProjectDestinations(tx: Transaction | DB) {
  await tx.execute(sql`select pg_advisory_xact_lock(734821, 1)`);
}

export async function findDuplicateProjectLinks(
  db: Transaction | DB,
  links: ProjectLinkInput[],
  excludeProjectId?: number,
) {
  if (!links.some(normalizedProjectLink)) return [];
  // Normalize stored links too: older records need no destructive backfill.
  const rows = await db
    .select({
      url: projectLinks.url,
      kind: projectLinks.kind,
      slug: projects.slug,
      name: projects.name,
      isPublic: sql<boolean>`(${publicProjectConditions})`,
    })
    .from(projectLinks)
    .innerJoin(projects, eq(projects.id, projectLinks.projectId))
    .where(
      and(
        isNull(projects.deletedAt),
        inArray(projects.status, ["published", "pending"]),
        excludeProjectId ? ne(projects.id, excludeProjectId) : undefined,
      ),
    );
  const destinations = new Map(
    rows.map((row) => [normalizedProjectLink(row), row]),
  );
  return links.flatMap((link, index) => {
    const key = normalizedProjectLink(link);
    const existing = key ? destinations.get(key) : undefined;
    return existing
      ? [
          {
            index,
            message: "Este link já está associado a outro projeto.",
            project: existing.isPublic
              ? { slug: existing.slug, name: existing.name }
              : null,
          },
        ]
      : [];
  });
}

export async function assertUniqueProjectLinks(
  tx: Transaction | DB,
  projectId: number,
  links: ProjectLinkInput[],
) {
  const duplicates = await findDuplicateProjectLinks(tx, links, projectId);
  if (duplicates.length)
    throw new ProjectPublicationError(
      duplicates.map((item) => ({
        path: `links.${item.index}.url`,
        message: item.message,
      })),
    );
}
