import { config } from "@/config";
import { DB } from "@/db";
import { ProjectsService } from "../projects/projects-services";
import { renderProjectShareImage } from "./share-image-renderer";

const IMAGE_FETCH_TIMEOUT_MS = 3_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const CACHE_LIMIT = 200;
const fetchableTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// Rendering costs a couple hundred milliseconds of CPU, and crawlers re-fetch
// the same card many times, so recent cards are kept in memory. The key carries
// everything drawn on the card: an edit or a new vote yields a fresh image.
const cache = new Map<string, Buffer>();

function remember(key: string, png: Buffer) {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, png);
}

/**
 * Inlines a project image as a data URI. Only our own bucket is fetched — the
 * URLs come from stored keys, but the check keeps this from ever becoming a
 * proxy to an arbitrary host — and any failure just drops the image.
 */
async function fetchImage(url: string | null | undefined) {
  const bucket = config.CLOUDFLARE_PUBLIC_URL;
  if (!url || !bucket || !url.startsWith(`${bucket.replace(/\/$/, "")}/`)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!response.ok || !fetchableTypes.has(type)) return null;
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${body.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The PNG card for a project a logged-out visitor could open, or null when
 * there is no such project — drafts and hidden projects included.
 */
async function getProjectShareImage(db: DB, slug: string) {
  const project = await ProjectsService.getProjectBySlug(db, slug);
  if (!project) return null;

  const key = [project.id, project.updatedAt, project.upvoteCount].join(":");
  const cached = cache.get(key);
  if (cached) return cached;

  const [logo, cover] = await Promise.all([
    fetchImage(project.logoUrl),
    fetchImage(project.galleryImageUrls[0]),
  ]);
  const png = await renderProjectShareImage({
    name: project.name,
    tagline: project.shortDescription,
    category: project.category?.name,
    upvoteCount: project.upvoteCount,
    logo,
    cover,
  });
  remember(key, png);
  return png;
}

export const ShareImagesService = { getProjectShareImage };
