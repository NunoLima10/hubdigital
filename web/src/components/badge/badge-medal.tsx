import { cn } from "@/lib/utils";
import type { BadgeKey } from "@hubdigital/shared";
import { useId, type CSSProperties, type ReactNode } from "react";

/*
 * The badge artwork, drawn in a 200×200 box. Every badge shares the same
 * anatomy — a body (coin, gem, rock or hexagon), the H mark, a number or
 * symbol, decoration (stars, laurels, commit graph) and a glint — so the
 * entry animation in index.css can drive any of them through the same
 * classes. `compact` drops the decoration, which only turns into noise at
 * avatar size, and enlarges the mark and number.
 */

type Point = [number, number];

const polygon = (r: number, sides: number, offset = 0, jitter: number[] = []) =>
  Array.from({ length: sides }, (_, i): Point => {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2 + offset;
    const radius = r * (jitter[i] ?? 1);
    return [100 + radius * Math.cos(angle), 100 + radius * Math.sin(angle)];
  });

const points = (list: Point[]) =>
  list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const star = (cx: number, cy: number, outer: number) =>
  points(
    Array.from({ length: 10 }, (_, i): Point => {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 ? outer * 0.45 : outer;
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    }),
  );

const LEAF = "M0 0C5-6 5-13 0-18C-5-13-5-6 0 0Z";
// [x, y, rotation, scale] along the left branch, bottom to top.
const LAUREL_LEAVES: [number, number, number, number][] = [
  [72, 163, -64, 8], [72, 163, 6, 8], [65, 155, -58, 9], [65, 155, 10, 9],
  [60, 145, -50, 9], [60, 145, 16, 9], [57, 134, -40, 9], [57, 134, 22, 9],
  [56, 123, -26, 9], [56, 123, 28, 8], [56, 116, 4, 9],
];

const GEM_OUTER = polygon(92, 10, Math.PI / 10);
const GEM_INNER = polygon(80, 10, Math.PI / 10);
const GEM_TABLE = polygon(44, 10);
const GEM_BLUES = [
  "#1E7BFF", "#0E5BEA", "#3A94FF", "#0A4FD6", "#2A86FF",
  "#0C55E0", "#4AA2FF", "#0847C8", "#2C8CFF", "#0E5DEB",
];

const ROCK_OUTER = polygon(90, 12, 0.15, [1, 0.95, 1.02, 0.96, 1.01, 0.94, 1, 0.97, 1.03, 0.95, 0.99, 0.96]);
const ROCK_INNER = polygon(74, 12, 0.15);
const ROCK_GREYS = ["#3A3F46", "#2A2E34", "#33383F", "#22262B", "#3F444B", "#2D3137"];
const LAVA_CRACKS = [1, 4, 7, 10]
  .map((i) => `M${ROCK_OUTER[i].map((v) => v.toFixed(1)).join(" ")}L${ROCK_INNER[i].map((v) => v.toFixed(1)).join(" ")}`)
  .join("");

const HEX_OUTER = polygon(92, 6);
const HEX_INNER = polygon(78, 6);
const HEX_GRAPH = polygon(66, 6);
const HEX_SHADES = ["#7CF0C0", "#2FBF86", "#0E8A5F", "#0A6C4A", "#1FA673", "#5FE3AE"];

type Palette = {
  mark: [string, string];
  number: string;
  star: [string, string];
  leaf: [string, string];
};

const palettes: Record<BadgeKey, Palette> = {
  founder: { mark: ["#FFFFFF", "#D7E9FF"], number: "#FFFFFF", star: ["#FFF3B0", "#F2B620"], leaf: ["#FFFFFF", "#CFE3FF"] },
  "founding-gold": { mark: ["#FFF9EA", "#F2DDB0"], number: "#FFF6E2", star: ["#FFF2C4", "#F5CF6B"], leaf: ["#FFF0C8", "#E9C26A"] },
  "founding-silver": { mark: ["#3A7BFF", "#0B43E0"], number: "#0B2C86", star: ["#FFFFFF", "#9AA6B6"], leaf: ["#FFFFFF", "#A3AEBD"] },
  "founding-basalt": { mark: ["#FFFFFF", "#D5DAE0"], number: "#FFFFFF", star: ["#F2F4F7", "#8F98A4"], leaf: ["#F2F4F7", "#98A2AE"] },
  maintainer: { mark: ["#FFFFFF", "#CFF7E6"], number: "#FFFFFF", star: ["#FFFFFF", "#CFF7E6"], leaf: ["#FFFFFF", "#CFF7E6"] },
};

const numbers: Partial<Record<BadgeKey, string>> = {
  founder: "1",
  "founding-gold": "10",
  "founding-silver": "50",
  "founding-basalt": "100",
};

const coins = {
  "founding-gold": { rim: ["#FFF0A0", "#F4C542", "#B57A0C", "#FFD86A"], disc: ["#E7A423", "#A9650B"], ring: "#FFE08A" },
  "founding-silver": { rim: ["#FFFFFF", "#D9E0E8", "#8592A4", "#F4F7FA"], disc: ["#F4F6F9", "#C4CCD7"], ring: "#FFFFFF" },
} as const;

/** Per-element animation delay for the staged entry, in milliseconds. */
const delay = (ms: number) => ({ "--badge-delay": `${ms}ms` }) as CSSProperties;

function Mark({ id, compact }: { id: string; compact: boolean }) {
  return (
    <svg
      x={compact ? 64 : 71}
      y={compact ? 38 : 54}
      width={compact ? 72 : 58}
      height={compact ? 84 : 68}
      viewBox="128 120 104 121"
      fill={`url(#${id}-mark)`}
      filter={`url(#${id}-emboss)`}
    >
      <path d="M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z" />
      <path d="M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z" />
      <path d="M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z" />
    </svg>
  );
}

function Laurels({ id }: { id: string }) {
  const branch = (
    <>
      <path d="M80 170Q57 156 56 116" fill="none" stroke={`url(#${id}-leaf)`} strokeWidth="2.4" strokeLinecap="round" />
      {LAUREL_LEAVES.map(([x, y, rotate, scale], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale / 9})`}>
          <path className="badge-medal__leaf" style={delay(520 + i * 45)} d={LEAF} fill={`url(#${id}-leaf)`} />
        </g>
      ))}
    </>
  );
  return (
    <>
      <g>{branch}</g>
      <g transform="translate(200 0) scale(-1 1)">{branch}</g>
    </>
  );
}

function Stars({ id }: { id: string }) {
  return (
    <>
      <polygon className="badge-medal__pop" style={delay(760)} points={star(79, 42, 5.5)} fill={`url(#${id}-star)`} />
      <polygon className="badge-medal__pop" style={delay(850)} points={star(100, 36, 12)} fill={`url(#${id}-star)`} />
      <polygon className="badge-medal__pop" style={delay(940)} points={star(121, 42, 5.5)} fill={`url(#${id}-star)`} />
    </>
  );
}

function GemBody({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FFFFFF" />
          <stop offset=".35" stopColor="#C9D3DF" />
          <stop offset=".7" stopColor="#8996A8" />
          <stop offset="1" stopColor="#EEF2F6" />
        </linearGradient>
        <radialGradient id={`${id}-table`} cx=".4" cy=".3" r=".8">
          <stop stopColor="#5CB4FF" />
          <stop offset="1" stopColor="#0B4ED8" />
        </radialGradient>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#FFFFFF" stopOpacity=".45" />
          <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={points(GEM_OUTER)} fill={`url(#${id}-bezel)`} stroke="#F4F8FF" strokeWidth="1.5" />
      <polygon points={points(GEM_INNER)} fill="#0A3FB8" stroke="#06307F" strokeWidth="1.2" />
      {GEM_INNER.map((a, i) => {
        const b = GEM_INNER[(i + 1) % 10];
        const c = GEM_TABLE[(i + 1) % 10];
        const e = GEM_TABLE[i];
        return (
          <g key={i}>
            <polygon points={points([a, b, c])} fill={GEM_BLUES[i]} />
            <polygon points={points([a, c, e])} fill={GEM_BLUES[(i + 5) % 10]} opacity=".9" />
          </g>
        );
      })}
      <polygon points={points(GEM_TABLE)} fill={`url(#${id}-table)`} />
      <polygon points={points(GEM_INNER)} fill={`url(#${id}-light)`} />
      <g transform="translate(100 181)">
        <path d="M-11 -6h22l6 6-17 14-17-14z" fill="#7FE3FF" stroke="#E8FBFF" strokeWidth="1" />
        <path d="M-11 -6l5 6h12l5-6M-17 0h34M-6 0l6 14 6-14" fill="none" stroke="#2BB5E8" strokeWidth=".8" />
      </g>
    </>
  );
}

function CoinBody({ id, tier }: { id: string; tier: keyof typeof coins }) {
  const coin = coins[tier];
  return (
    <>
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          {coin.rim.map((color, i) => (
            <stop key={i} offset={[0, 0.35, 0.7, 1][i]} stopColor={color} />
          ))}
        </linearGradient>
        <radialGradient id={`${id}-disc`} cx=".38" cy=".3" r=".85">
          <stop stopColor={coin.disc[0]} />
          <stop offset="1" stopColor={coin.disc[1]} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill={`url(#${id}-rim)`} />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#000" strokeOpacity=".18" strokeWidth="3" />
      <circle cx="100" cy="100" r="76" fill={`url(#${id}-disc)`} />
      <circle cx="100" cy="100" r="70" fill="none" stroke={coin.ring} strokeOpacity=".55" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="1" />
    </>
  );
}

function RockBody({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-rock`} cx=".35" cy=".3" r=".9">
          <stop stopColor="#4E555E" />
          <stop offset=".6" stopColor="#25292F" />
          <stop offset="1" stopColor="#121417" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx=".4" cy=".3" r=".9">
          <stop stopColor="#363B42" />
          <stop offset="1" stopColor="#16181C" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon points={points(ROCK_OUTER)} fill={`url(#${id}-rock)`} />
      {ROCK_OUTER.map((a, i) => (
        <polygon
          key={i}
          points={points([a, ROCK_OUTER[(i + 1) % 12], ROCK_INNER[(i + 1) % 12], ROCK_INNER[i]])}
          fill={ROCK_GREYS[i % 6]}
          opacity=".85"
        />
      ))}
      <circle cx="100" cy="100" r="74" fill={`url(#${id}-core)`} />
      <g className="badge-medal__lava" filter={`url(#${id}-glow)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points={points(ROCK_INNER)} stroke="#FF6A13" strokeWidth="2" />
        <path d={LAVA_CRACKS} stroke="#FF8A2A" strokeWidth="1.6" />
        <polygon className="badge-medal__lava-flow" points={points(ROCK_INNER)} stroke="#FFD27A" strokeWidth="1.2" />
      </g>
    </>
  );
}

function HexBody({ id, compact }: { id: string; compact: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-hex`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#C9FFE8" />
          <stop offset=".4" stopColor="#34C98F" />
          <stop offset=".75" stopColor="#0A6B4A" />
          <stop offset="1" stopColor="#8FF0C8" />
        </linearGradient>
        <radialGradient id={`${id}-hex-core`} cx=".38" cy=".3" r=".9">
          <stop stopColor="#1DAA76" />
          <stop offset=".6" stopColor="#0B6B4B" />
          <stop offset="1" stopColor="#053D2B" />
        </radialGradient>
        <linearGradient id={`${id}-hex-light`} x1="0" y1="0" x2=".7" y2="1">
          <stop stopColor="#FFFFFF" stopOpacity=".35" />
          <stop offset=".55" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-pulse`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon points={points(HEX_OUTER)} fill={`url(#${id}-hex)`} stroke="#E6FFF4" strokeWidth="1.5" strokeLinejoin="round" />
      {HEX_OUTER.map((a, i) => (
        <polygon key={i} points={points([a, HEX_OUTER[(i + 1) % 6], HEX_INNER[(i + 1) % 6], HEX_INNER[i]])} fill={HEX_SHADES[i]} />
      ))}
      <polygon points={points(HEX_INNER)} fill={`url(#${id}-hex-core)`} stroke="#043322" strokeOpacity=".5" strokeWidth="2.5" />
      <polygon points={points(HEX_OUTER)} fill={`url(#${id}-hex-light)`} />
      {!compact && (
        <>
          <polygon className="badge-medal__draw" style={{ ...delay(700), "--badge-length": 400 } as CSSProperties} points={points(HEX_GRAPH)} fill="none" stroke="#9FF5D2" strokeOpacity=".55" strokeWidth="1.6" />
          <polygon className="badge-medal__commit-pulse" points={points(HEX_GRAPH)} fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" filter={`url(#${id}-pulse)`} />
          {HEX_GRAPH.map(([x, y], i) => (
            <circle key={i} className="badge-medal__pop" style={delay(950 + i * 80)} cx={x} cy={y} r="4.2" fill="#E9FFF5" stroke="#0A5C40" strokeWidth="1.6" />
          ))}
          <g fill="none" stroke="#E9FFF5" strokeWidth="3" strokeLinecap="round">
            <path className="badge-medal__draw" style={{ ...delay(1300), "--badge-length": 24 } as CSSProperties} d="M89 28V50" />
            <path className="badge-medal__draw" style={{ ...delay(1500), "--badge-length": 30 } as CSSProperties} d="M112 34C112 46 100 46 90 50" />
          </g>
          <circle className="badge-medal__pop" style={delay(1250)} cx="89" cy="26" r="4" fill="#E9FFF5" />
          <circle className="badge-medal__pop" style={delay(1450)} cx="112" cy="31" r="4" fill="#E9FFF5" />
          <circle className="badge-medal__pop" style={delay(1700)} cx="89" cy="53" r="4" fill="#E9FFF5" />
        </>
      )}
    </>
  );
}

function CodeSymbol({ id, compact }: { id: string; compact: boolean }) {
  const draw = (ms: number, length: number) =>
    compact ? undefined : ({ ...delay(ms), "--badge-length": length } as CSSProperties);
  return (
    <g
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={compact ? 9 : 6}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={`url(#${id}-emboss)`}
      transform={`translate(100 ${compact ? 150 : 154}) scale(${compact ? 1.25 : 1})`}
    >
      <path className={compact ? undefined : "badge-medal__draw"} style={draw(1850, 34)} d="M-16-10-28 0-16 10" />
      <path className={compact ? undefined : "badge-medal__draw"} style={draw(1950, 26)} d="M-5 13 5-13" />
      <path className={compact ? undefined : "badge-medal__draw"} style={draw(2050, 34)} d="M16-10 28 0 16 10" />
    </g>
  );
}

const clipShapes: Record<BadgeKey, ReactNode> = {
  founder: <polygon points={points(GEM_INNER)} />,
  "founding-gold": <circle cx="100" cy="100" r="76" />,
  "founding-silver": <circle cx="100" cy="100" r="76" />,
  "founding-basalt": <circle cx="100" cy="100" r="74" />,
  maintainer: <polygon points={points(HEX_OUTER)} />,
};

export function BadgeMedal({
  badgeKey,
  compact = false,
  className,
}: {
  badgeKey: BadgeKey;
  /** Avatar-size rendering: no stars, laurels or commit graph. */
  compact?: boolean;
  className?: string;
}) {
  const id = `badge${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const palette = palettes[badgeKey];
  const number = numbers[badgeKey];
  const isMaintainer = badgeKey === "maintainer";

  return (
    <svg
      viewBox="0 0 200 200"
      data-badge={badgeKey}
      data-compact={compact || undefined}
      className={cn("badge-medal overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-mark`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={palette.mark[0]} />
          <stop offset="1" stopColor={palette.mark[1]} />
        </linearGradient>
        <linearGradient id={`${id}-star`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={palette.star[0]} />
          <stop offset="1" stopColor={palette.star[1]} />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={palette.leaf[0]} />
          <stop offset="1" stopColor={palette.leaf[1]} />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#06142E" floodOpacity=".28" />
        </filter>
        <filter id={`${id}-emboss`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#061433" floodOpacity=".4" />
        </filter>
        <clipPath id={`${id}-clip`}>{clipShapes[badgeKey]}</clipPath>
      </defs>

      <g className="badge-medal__body" filter={`url(#${id}-shadow)`}>
        {badgeKey === "founder" && <GemBody id={id} />}
        {(badgeKey === "founding-gold" || badgeKey === "founding-silver") && (
          <CoinBody id={id} tier={badgeKey} />
        )}
        {badgeKey === "founding-basalt" && <RockBody id={id} />}
        {isMaintainer && <HexBody id={id} compact={compact} />}

        {!compact && !isMaintainer && (
          <>
            <Laurels id={id} />
            <Stars id={id} />
          </>
        )}

        <Mark id={id} compact={compact} />

        {number ? (
          <text
            x="100"
            y={compact ? 168 : 162}
            textAnchor="middle"
            fill={palette.number}
            filter={`url(#${id}-emboss)`}
            fontFamily="Geist, Inter, system-ui, sans-serif"
            fontWeight="800"
            fontSize={compact ? (number.length > 2 ? 40 : 46) : number.length > 2 ? 34 : 38}
            letterSpacing="-1"
          >
            {number}
          </text>
        ) : (
          isMaintainer && <CodeSymbol id={id} compact={compact} />
        )}

        <g clipPath={`url(#${id}-clip)`}>
          <path className="badge-medal__glint" d="M20 0h28L8 200h-28z" fill="#FFFFFF" opacity=".45" />
        </g>

        {badgeKey === "founder" && !compact && (
          <>
            <path className="badge-medal__twinkle" d="M150 30l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#FFFFFF" />
            <path className="badge-medal__twinkle" style={{ animationDelay: "1.2s" }} d="M48 58l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z" fill="#FFFFFF" />
          </>
        )}
      </g>
    </svg>
  );
}
