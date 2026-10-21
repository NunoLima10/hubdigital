import { projectPublicationSchema, type ProjectLinkInput } from "@hubdigital/shared";
import { withLocation, type LocationColumns } from "./location";

export class ProjectPublicationError extends Error {
  statusCode = 400;
  code = "PROJECT_NOT_READY";
  constructor(public issues: { path: string; message: string }[]) {
    super("Completa os campos indicados antes de publicar o projeto.");
  }
}

/** Check the stored record, not just the fields in a PATCH or a client form. */
export function assertProjectReady(
  row: LocationColumns & {
    description?: string | null;
    youtubeVideoUrl?: string | null;
    youtubeVideoId?: string | null;
    images: { storageKey: string }[];
    links: ProjectLinkInput[];
    secondaryCategoryIds?: number[];
  },
) {
  const result = projectPublicationSchema.safeParse({
    ...withLocation(row),
    description: row.description || undefined,
    youtubeVideoUrl: row.youtubeVideoUrl || (row.youtubeVideoId
      ? `https://www.youtube.com/watch?v=${row.youtubeVideoId}` : null),
    galleryImageKeys: row.images.map((image) => image.storageKey),
  });
  if (!result.success) {
    throw new ProjectPublicationError(result.error.issues.map((issue) => ({
      path: issue.path.join("."), message: issue.message,
    })));
  }
  return result.data;
}
