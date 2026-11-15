/*
 * Banners a project puts on its own site, like "Featured on …" badges. Each
 * is one self-contained 250×54 SVG with no CSS, web fonts or scripts, so the
 * API can later serve the same markup as an image (`<img src=…svg>`) and it
 * looks the same anywhere. Award banners carry a small Cabo Verde flag on the
 * right edge; the upvote banner carries the live count instead.
 */

export const embedBannerKinds = [
  "featured",
  "upvotes",
  "weekly-top-1",
  "weekly-top-3",
  "weekly-top-10",
  "staff-pick",
  "project-of-month",
] as const;

export type EmbedBannerKind = (typeof embedBannerKinds)[number];
export type EmbedBannerTheme = "light" | "dark";

const FLAG_BLUE = "#003893";
const FLAG_RED = "#CF2027";
const FLAG_YELLOW = "#F7D116";
const COBALT = { light: "#024BFF", dark: "#4D7FFF" };
const FONT = "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const themes = {
  light: { bg: "#FFFFFF", fg: "#0A0A0A", muted: "#737373", line: "#E5E5E5", tile: "#0A0A0A", tileInk: "#FFFFFF" },
  dark: { bg: "#0A0A0A", fg: "#FFFFFF", muted: "#A1A1A1", line: "#2A2A2A", tile: "#FFFFFF", tileInk: "#0A0A0A" },
} as const;

const H_PATHS = [
  "M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z",
  "M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z",
  "M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z",
];

const monthsShort = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function periodShort(period?: string) {
  if (!period) return "";
  const week = /^(\d{4})-W(\d{2})$/.exec(period);
  if (week) return ` · S${Number(week[2])} ${week[1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month) return ` · ${monthsShort[Number(month[2]) - 1]} ${month[1]}`;
  return "";
}

function eyebrow(kind: EmbedBannerKind, period?: string, rank?: number) {
  switch (kind) {
    case "featured":
      return "PUBLICADO NO";
    case "upvotes":
      return "APOIE NO";
    case "weekly-top-1":
      return `1º DA SEMANA${periodShort(period)}`;
    case "weekly-top-3":
    case "weekly-top-10":
      return `${rank ?? (kind === "weekly-top-3" ? 3 : 10)}º DA SEMANA${periodShort(period)}`;
    case "staff-pick":
      return "ESCOLHA DA EQUIPA";
    case "project-of-month":
      return `PROJETO DO MÊS${periodShort(period)}`;
  }
}

/** Five-point star centred on (cx, cy), outer radius r. */
function starPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const d = i % 2 === 0 ? r : r * 0.42;
    return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/** Award tiles reuse the plaque materials, shrunk to a 34px square. */
const awardTiles: Partial<Record<EmbedBannerKind, { frame: string; panel: string; ink: string }>> = {
  "weekly-top-1": { frame: "#F2C14E", panel: "#D99A1E", ink: "#FFFFFF" },
  "weekly-top-3": { frame: "#C4CCD7", panel: "#E9EDF2", ink: "#1B2A44" },
  "weekly-top-10": { frame: "#D58E52", panel: "#A35F2C", ink: "#FFF1E4" },
  "staff-pick": { frame: "#F2C14E", panel: "#0E8A5F", ink: "#FFFFFF" },
  "project-of-month": { frame: "#F2C14E", panel: FLAG_BLUE, ink: "#FFFFFF" },
};

function Tile({ kind, theme, rank }: { kind: EmbedBannerKind; theme: EmbedBannerTheme; rank?: number }) {
  const award = awardTiles[kind];
  if (!award) {
    const t = themes[theme];
    return (
      <>
        <rect x="10" y="10" width="34" height="34" rx="8" fill={t.tile} />
        <svg x="17" y="16" width="20" height="22" viewBox="128 120 104 121" fill={t.tileInk}>
          {H_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </>
    );
  }
  return (
    <>
      <rect x="10" y="10" width="34" height="34" rx="9" fill={award.frame} />
      <rect x="13" y="13" width="28" height="28" rx="6.5" fill={award.panel} />
      <g fill={award.ink}>
        {(kind === "weekly-top-1" || kind === "weekly-top-3" || kind === "weekly-top-10") && (
          <text x="27" y="32.5" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="15">
            {kind === "weekly-top-1" ? 1 : (rank ?? (kind === "weekly-top-3" ? 3 : 10))}
          </text>
        )}
        {kind === "staff-pick" && (
          <svg x="20" y="19" width="14" height="16" viewBox="128 120 104 121">
            {H_PATHS.map((d) => (
              <path key={d} d={d} />
            ))}
          </svg>
        )}
        {kind === "project-of-month" && (
          /* The plaque's flag field shrunk to the tile: stripes a little below
             the middle, the ring of ten stars left of centre over them. */
          <>
            <rect x="13" y="25.6" width="28" height="1.3" fill="#FFFFFF" />
            <rect x="13" y="26.9" width="28" height="1.3" fill={FLAG_RED} />
            <rect x="13" y="28.2" width="28" height="1.3" fill="#FFFFFF" />
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
              return (
                <polygon
                  key={i}
                  points={starPoints(23.5 + 6 * Math.cos(a), 27.5 + 6 * Math.sin(a), 1.5)}
                  fill={FLAG_YELLOW}
                />
              );
            })}
          </>
        )}
      </g>
    </>
  );
}

/** A sliver of the Cabo Verde flag: blue field, white-red-white stripes, the star ring. */
function FlagEdge({ clipId }: { clipId: string }) {
  return (
    <g clipPath={`url(#${clipId})`}>
      <rect x="222" y="0" width="28" height="54" fill={FLAG_BLUE} />
      <rect x="222" y="27" width="28" height="4.5" fill="#FFFFFF" />
      <rect x="222" y="31.5" width="28" height="4.5" fill={FLAG_RED} />
      <rect x="222" y="36" width="28" height="4.5" fill="#FFFFFF" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={235 + 8 * Math.cos(a)} cy={33.5 + 8 * Math.sin(a)} r="1.5" fill={FLAG_YELLOW} />;
      })}
    </g>
  );
}

export function ProjectEmbedBanner({
  kind,
  theme = "light",
  count,
  period,
  rank,
  className,
}: {
  kind: EmbedBannerKind;
  theme?: EmbedBannerTheme;
  /** Upvote total, for the `upvotes` banner. */
  count?: number;
  /** `2026-W46` or `2026-11`. */
  period?: string;
  /** Exact weekly place, for top-3 and top-10. */
  rank?: number;
  className?: string;
}) {
  const t = themes[theme];
  const clipId = `embed-${kind}-${theme}`;
  const label = eyebrow(kind, period, rank);
  const isUpvotes = kind === "upvotes";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="250"
      height="54"
      viewBox="0 0 250 54"
      role="img"
      aria-label={`${label} Hub Digital${isUpvotes ? `: ${count ?? 0} apoios` : ""}`}
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0.5" y="0.5" width="249" height="53" rx="10" />
        </clipPath>
      </defs>
      <rect x="0.5" y="0.5" width="249" height="53" rx="10" fill={t.bg} stroke={t.line} />
      <Tile kind={kind} theme={theme} rank={rank} />
      <text x="54" y="23" fontFamily={FONT} fontSize="8.5" fontWeight="600" letterSpacing=".9" fill={t.muted}>
        {label}
      </text>
      <text x="54" y="41" fontFamily={FONT} fontSize="18" fontWeight="600" letterSpacing="-.4" fill={t.fg}>
        Hub Digital
      </text>
      {isUpvotes ? (
        <g fill={COBALT[theme]}>
          <path transform="translate(204 9) scale(.75)" d="M9 18v-6H5l7-7 7 7h-4v6H9z" />
          <text x="213" y="42" textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700">
            {count ?? 0}
          </text>
        </g>
      ) : (
        <FlagEdge clipId={clipId} />
      )}
    </svg>
  );
}
