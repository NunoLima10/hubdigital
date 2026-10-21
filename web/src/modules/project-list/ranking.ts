import { seo } from "@/lib/seo";

/** Splits an ISO week id ("2026-W35"); null when the URL holds anything else. */
export function parseRankingWeek(week: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  return match ? { year: Number(match[1]), week: Number(match[2]) } : null;
}

/** Head tags for /rankings/$week; a malformed week is kept out of the index. */
export function rankingHead(week: string) {
  const parsed = parseRankingWeek(week);
  return seo({
    title: parsed ? `Ranking da semana ${parsed.week} de ${parsed.year}` : "Ranking",
    description: "Os projetos mais votados pela comunidade do Hub Digital nesta semana.",
    path: `/rankings/${encodeURIComponent(week)}`,
    noIndex: !parsed,
  });
}
