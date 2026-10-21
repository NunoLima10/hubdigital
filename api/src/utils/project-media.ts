import { and, eq, inArray } from "drizzle-orm";
import type { DB } from "@/db";
import { fileUploads } from "@/db/schemas";
import { ProjectPublicationError } from "./project-publication";

type Media = { logoUrl?: string | null; galleryImageKeys?: string[] };
export async function assertProjectMedia(db: Pick<DB, "query">, userId: string, media: Media, requireComplete = false) {
  const expected = [
    ...(media.logoUrl ? [{ key: media.logoUrl, type: "project_logo", path: "logoUrl" }] : []),
    ...(media.galleryImageKeys ?? []).map((key, index) => ({ key, type: "project_gallery", path: `galleryImageKeys.${index}` })),
  ];
  if (!expected.length) return;
  const uploads = await db.query.fileUploads.findMany({
    where: and(eq(fileUploads.userId, userId), inArray(fileUploads.key, expected.map((item) => item.key))),
  });
  const issues = expected.flatMap((item) => {
    const row = uploads.find((upload) => upload.key === item.key && upload.type === item.type);
    if (!row) return [{ path: item.path, message: "Esta imagem não pertence ao projeto. Carrega o ficheiro novamente." }];
    return requireComplete && !row.completedAt ? [{ path: item.path, message: "Esta imagem ainda não terminou de carregar. Tenta novamente ou remove-a." }] : [];
  });
  if (issues.length) throw new ProjectPublicationError(issues);
}
