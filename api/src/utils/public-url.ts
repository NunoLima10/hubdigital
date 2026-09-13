import { config } from "@/config";

/**
 * Projects store the R2 object key (e.g. `project_logo/<uuid>-logo.png`), not a
 * full URL, so the bucket's public domain can change without rewriting rows.
 * Values that are already absolute URLs are passed through untouched — seed data
 * and older rows may hold one.
 */
export function toPublicUrl(key: string): string;
export function toPublicUrl(key: null | undefined): null;
export function toPublicUrl(key: string | null | undefined): string | null;
export function toPublicUrl(key: string | null | undefined) {
  if (!key) return null;

  if (/^https?:\/\//i.test(key)) return key;

  const publicUrl = config.CLOUDFLARE_PUBLIC_URL?.replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");

  return publicUrl ? `${publicUrl}/${normalizedKey}` : normalizedKey;
}
