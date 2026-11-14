import { and, eq, notInArray } from "drizzle-orm";
import type { DB } from "@/db";
import { projectLinks } from "@/db/schemas";
import { BadRequestError } from "./custom-errors";
import type { ProjectLinkInput } from "@hubdigital/shared";

export function serializeProjectLinks(rows: (typeof projectLinks.$inferSelect)[]) {
  return [...rows].sort((a, b) => a.position - b.position).map(({ id, kind, url, label, isPrimary, referralAttribution }) => ({
    id, kind, url, isPrimary, referralAttribution, ...(label ? { label } : {}),
  }));
}

type Transaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
export async function syncProjectLinks(tx: Transaction, projectId: number, links: ProjectLinkInput[]) {
  if (links.filter((link) => link.isPrimary).length > 1) throw new BadRequestError("Escolhe apenas um link principal.");
  const existing = await tx.query.projectLinks.findMany({ where: eq(projectLinks.projectId, projectId) });
  const used = new Set<number>();
  const selected = links.map((link) => {
    const row = link.id ? existing.find((candidate) => candidate.id === link.id)
      : existing.find((candidate) => !used.has(candidate.id) && candidate.kind === link.kind && candidate.url === link.url);
    if (link.id && !row) throw new BadRequestError("Um dos links não pertence a este projeto.");
    if (row) {
      if (used.has(row.id)) throw new BadRequestError("O mesmo link não pode aparecer duas vezes.");
      used.add(row.id);
    }
    return { link, id: row?.id };
  });
  // Temporarily release primary/position constraints within this transaction.
  for (const row of existing) await tx.update(projectLinks).set({ isPrimary: false, position: -row.id }).where(eq(projectLinks.id, row.id));
  const retained: number[] = [];
  for (const [position, { link, id }] of selected.entries()) {
    const values = { referralAttribution: link.referralAttribution ?? false, kind: link.kind, url: link.url, label: link.label || null, isPrimary: link.isPrimary, position };
    if (id) {
      await tx.update(projectLinks).set(values).where(and(eq(projectLinks.id, id), eq(projectLinks.projectId, projectId)));
      retained.push(id);
    } else {
      const [created] = await tx.insert(projectLinks).values({ ...values, projectId }).returning({ id: projectLinks.id });
      retained.push(created.id);
    }
  }
  await tx.delete(projectLinks).where(and(eq(projectLinks.projectId, projectId), retained.length ? notInArray(projectLinks.id, retained) : undefined));
}
