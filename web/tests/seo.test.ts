import { describe, expect, it } from "vitest";
import { jsonLd, seo } from "../src/lib/seo";
import { renderSitemap } from "../src/lib/sitemap";
import { makerHead } from "../src/modules/makers/seo";
import { projectHead, projectShareImageUrl } from "../src/modules/project-detail/seo";
import { parseRankingWeek, rankingHead } from "../src/modules/project-list/ranking";
import type { Project } from "../src/modules/submit/types/project";
import { parseApiDate } from "../src/utils/api-date";
import type { MakerProfile } from "@hubdigital/shared";

type Tag = { title?: string; name?: string; property?: string; content?: string };

function tag(head: { meta: Tag[] }, key: string) {
  return head.meta.find((meta) => meta.name === key || meta.property === key)?.content;
}

const project = {
  slug: "praia-app",
  name: "Praia App",
  shortDescription: "Horários dos autocarros da Praia",
  status: "published",
  updatedAt: "2026-10-11 22:08:09.087+00",
  publishedAt: "2026-10-11 22:07:11.045+00",
  upvoteCount: 3,
  galleryImageUrls: [],
  logoUrl: null,
  category: { id: 1, key: "mobility", name: "Mobilidade" },
  author: { id: "u1", name: "Ana", image: null, handle: "ana" },
} as unknown as Project;

describe("parseApiDate", () => {
  it("reads the Postgres text the API sends", () => {
    expect(parseApiDate("2026-10-11 22:07:11.045+00")?.toISOString()).toBe(
      "2026-10-11T22:07:11.045Z",
    );
  });

  it("returns null for missing or unparseable values", () => {
    expect(parseApiDate(null)).toBeNull();
    expect(parseApiDate("ontem")).toBeNull();
  });
});

describe("seo", () => {
  it("leaves canonical and og:url out of the root defaults", () => {
    const head = seo({});
    expect(tag(head, "og:url")).toBeUndefined();
    expect(head.links).toEqual([]);
  });

  it("drops the canonical link from a noindex page", () => {
    const head = seo({ path: "/sign-in", noIndex: true });
    expect(tag(head, "robots")).toBe("noindex");
    expect(head.links).toEqual([]);
  });

  it("escapes < in structured data so it cannot close the script tag", () => {
    expect(jsonLd({ name: "</script>" }).children).not.toContain("</script>");
  });
});

describe("projectHead", () => {
  it("points the share image at the API card, versioned by edits and votes", () => {
    const head = projectHead(project, "praia-app");
    expect(tag(head, "og:image")).toBe(projectShareImageUrl(project));
    expect(projectShareImageUrl(project)).toMatch(
      /\/share-images\/projects\/praia-app\?v=\d+-3$/,
    );
  });

  it("describes the project and adds its structured data", () => {
    const head = projectHead(project, "praia-app");
    expect(tag(head, "og:description")).toBe(project.shortDescription);
    expect(head.meta[0]).toEqual({ title: "Praia App | Hub Digital" });
    expect(JSON.parse(head.scripts![0].children)).toMatchObject({
      "@type": "SoftwareApplication",
      datePublished: "2026-10-11T22:07:11.045Z",
    });
  });

  it("keeps a missing or draft project out of the index", () => {
    expect(tag(projectHead(undefined, "nada"), "robots")).toBe("noindex");
    expect(tag(projectHead({ ...project, status: "draft" }, "praia-app"), "robots")).toBe(
      "noindex",
    );
  });
});

describe("makerHead", () => {
  const maker = { name: "Ana", bio: "  ", projectCount: 1 } as MakerProfile;

  it("falls back to a project count when there is no bio", () => {
    expect(tag(makerHead(maker, "ana"), "description")).toContain("1 projeto lançado");
  });

  it("prefers the bio", () => {
    expect(tag(makerHead({ ...maker, bio: "Designer no Mindelo" }, "ana"), "description")).toBe(
      "Designer no Mindelo",
    );
  });
});

describe("ranking week", () => {
  it("parses an ISO week id", () => {
    expect(parseRankingWeek("2026-W07")).toEqual({ year: 2026, week: 7 });
    expect(parseRankingWeek("semana-7")).toBeNull();
  });

  it("keeps a malformed week out of the index", () => {
    expect(tag(rankingHead("semana-7"), "robots")).toBe("noindex");
    expect(rankingHead("2026-W07").meta[0]).toEqual({
      title: "Ranking da semana 7 de 2026 | Hub Digital",
    });
  });
});

describe("renderSitemap", () => {
  it("lists absolute URLs with a day-precision lastmod", () => {
    const xml = renderSitemap([
      { path: "/" },
      { path: "/projects/a&b", lastModified: new Date("2026-10-11T22:07:11Z") },
    ]);
    expect(xml).toContain("<url><loc>http://localhost:5173/</loc></url>");
    expect(xml).toContain(
      "<loc>http://localhost:5173/projects/a&amp;b</loc><lastmod>2026-10-11</lastmod>",
    );
  });
});
