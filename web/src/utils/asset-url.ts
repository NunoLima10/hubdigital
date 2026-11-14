import { env } from "@app/env";

/**
 * Resolves a storage key (`project_logo/<uuid>-logo.png`) into a public URL.
 * The API already does this for saved projects; the web app only needs it to
 * preview an upload before the project exists. Absolute URLs pass through.
 */
export function toAssetUrl(key: string | null | undefined) {
  if (!key) return undefined;

  if (/^https?:\/\//i.test(key)) return key;

  const base = env.ASSETS_URL.replace(/\/+$/, "");

  return base ? `${base}/${key.replace(/^\/+/, "")}` : undefined;
}
