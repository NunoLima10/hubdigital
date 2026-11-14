import { absoluteUrl } from "@/lib/seo";

export type SitemapEntry = { path: string; lastModified?: Date | null };

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderEntry({ path, lastModified }: SitemapEntry) {
  const lastmod = lastModified
    ? `<lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod>`
    : "";
  return `<url><loc>${escapeXml(absoluteUrl(path))}</loc>${lastmod}</url>`;
}

/** A sitemaps.org document for the given pages. */
export function renderSitemap(entries: SitemapEntry[]) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(renderEntry),
    `</urlset>`,
  ].join("\n");
}
