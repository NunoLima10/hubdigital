import { env } from "@/app/env";

export const SITE_NAME = "Hub Digital";

export const SITE_DESCRIPTION =
  "Um Hub digital de código aberto para impulsionar a inovação em Cabo Verde, meio para descobrir, partilhar e apoiar projetos e produtos criados por caboverdianos";

const siteUrl = env.SITE_URL.replace(/\/$/, "");

/** Absolute URL on this site, as crawlers and share previews require. */
export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type SeoInput = {
  /** Page title without the site suffix; omitted on the home page. */
  title?: string;
  description?: string;
  /**
   * Path of the canonical page, e.g. "/projects/agora-me". Only the root
   * defaults leave it out, since they apply to pages they cannot name.
   */
  path?: string;
  /** Absolute 1200×630 image; the site card when omitted. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  /** Keeps the page out of search results (drafts, missing pages). */
  noIndex?: boolean;
};

/**
 * Title, description, Open Graph, Twitter and canonical tags for a page, ready
 * to return from a route's head(). Meta tags dedupe by name/property, so a
 * route's tags replace the root defaults instead of piling up.
 */
export function seo({
  title,
  description = SITE_DESCRIPTION,
  path,
  image = absoluteUrl("/og.png"),
  imageAlt = `${SITE_NAME} — projetos digitais feitos em Cabo Verde`,
  type = "website",
  noIndex = false,
}: SeoInput) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = path === undefined ? undefined : absoluteUrl(path);
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      ...(noIndex ? [{ name: "robots", content: "noindex" }] : []),
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "pt_PT" },
      { property: "og:type", content: type },
      ...(url ? [{ property: "og:url", content: url }] : []),
      { property: "og:title", content: title ?? SITE_NAME },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title ?? SITE_NAME },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: url && !noIndex ? [{ rel: "canonical", href: url }] : [],
  };
}

/** Signed-in and auth pages: titled for the browser tab, never indexed. */
export function privatePageHead(title: string) {
  return seo({ title, noIndex: true });
}

/**
 * A schema.org block for a route's head() scripts. "<" is escaped so a value
 * containing "</script>" cannot close the tag early.
 */
export function jsonLd(data: Record<string, unknown>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
      /</g,
      "\\u003c",
    ),
  };
}
