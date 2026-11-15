import { cn } from "@/lib/utils";
import { useEffect, useId, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

/*
 * Project achievements are square plaques; people's badges are round medals
 * (badge-medal.tsx), so the shape alone says who earned it. Every plaque
 * shares one anatomy in a 200×200 box — metal frame, enamel panel, the Hub
 * hallmark on the top edge, a symbol, a ribbon in the colours of the Cabo
 * Verde flag and a sweeping glint — so the CSS in index.css can animate any
 * of them through the same classes.
 */

export const projectPlaqueKinds = [
  "weekly-top-1",
  "weekly-top-3",
  "weekly-top-10",
  "upvotes-10",
  "upvotes-50",
  "upvotes-100",
  "upvotes-500",
  "staff-pick",
  "project-of-month",
  "pioneer",
] as const;

export type ProjectPlaqueKind = (typeof projectPlaqueKinds)[number];

type Point = [number, number];

const points = (list: Point[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const star = (cx: number, cy: number, r: number) =>
  points(
    Array.from({ length: 10 }, (_, i): Point => {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 ? r * 0.45 : r;
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    }),
  );

/** The ring of ten stars from the Cabo Verde flag, one per inhabited island and Santa Luzia. */
const starRing = (cx: number, cy: number, r: number, offset = 0) =>
  Array.from({ length: 10 }, (_, i): Point => {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2 + offset;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });

const spark = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

const FLAG_BLUE = "#003893";
const FLAG_RED = "#CF2027";
const FLAG_YELLOW = "#F7D116";
const COBALT = "#024BFF";
const INK = "#0A0A0A";

const H_PATHS = [
  "M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z",
  "M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z",
  "M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z",
];

const H_PART_CLASSES = ["project-plaque__h-top", "project-plaque__h-middle", "project-plaque__h-bottom"];

/** The Hub H. With animated, each stroke is tagged so the hover can split and rejoin them. */
function HMark({
  animated,
  ...props
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  animated?: boolean;
}) {
  return (
    <svg {...props} viewBox="128 120 104 121" overflow="visible">
      {H_PATHS.map((d, i) => (
        <path key={d} d={d} className={animated ? H_PART_CLASSES[i] : undefined} />
      ))}
    </svg>
  );
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts from 0 up to the value on mount, and again every time play changes. */
function CountUp({ value, play }: { value: number; play: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const duration = value >= 100 ? 1100 : 800;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, play]);
  return <>{shown}</>;
}

/** Eight sparks that fly out from (cx, cy) on hover, like a small firework. */
function Burst({ cx, cy, colors }: { cx: number; cy: number; colors: string[] }) {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={i}
          className="project-plaque__burst"
          cx={cx}
          cy={cy}
          r={i % 2 ? 2.6 : 3.6}
          fill={colors[i % colors.length]}
          style={
            {
              transformOrigin: `${cx}px ${cy}px`,
              "--burst-angle": `${i * 45 + 22.5}deg`,
              "--burst-distance": `${i % 2 ? 32 : 44}px`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

type Material = {
  frame: [string, string, string, string];
  /** Radial enamel; null uses the animated holographic gradient. */
  panel: [string, string] | null;
  ink: string;
};

const GOLD_FRAME: Material["frame"] = ["#FFF4BE", "#F2C14E", "#A86E0A", "#FFE08A"];
const STEEL_FRAME: Material["frame"] = ["#FFFFFF", "#CAD6E6", "#7B8BA3", "#F0F4FA"];

const materials: Record<ProjectPlaqueKind, Material> = {
  // Solid gold: the top spot. The flag is kept for Projeto do mês.
  "weekly-top-1": { frame: GOLD_FRAME, panel: ["#F2BC45", "#B57A10"], ink: "#FFF8E6" },
  "weekly-top-3": { frame: ["#FFFFFF", "#D7DEE7", "#7F8C9E", "#F3F6F9"], panel: ["#F2F5F9", "#B5C0CD"], ink: "#1B2A44" },
  "weekly-top-10": { frame: ["#FFD9B4", "#D58E52", "#7A4318", "#F5BC88"], panel: ["#C97C3F", "#7A4018"], ink: "#FFF1E4" },
  "upvotes-10": { frame: STEEL_FRAME, panel: ["#FFFFFF", "#D9E3F2"], ink: COBALT },
  "upvotes-50": { frame: STEEL_FRAME, panel: ["#3E80FF", "#0A35C8"], ink: "#FFFFFF" },
  "upvotes-100": { frame: GOLD_FRAME, panel: ["#2346D8", "#0A1458"], ink: "#FFFFFF" },
  "upvotes-500": { frame: ["#FFFFFF", "#D9E2F0", "#8A97AE", "#F5F8FC"], panel: null, ink: "#FFFFFF" },
  "staff-pick": { frame: GOLD_FRAME, panel: ["#17B07A", "#06553A"], ink: "#FFFFFF" },
  // The flag itself: blue field, stripes and the star ring (see FlagField).
  "project-of-month": { frame: GOLD_FRAME, panel: ["#1F5BFF", FLAG_BLUE], ink: "#FFFFFF" },
  pioneer: { frame: ["#9AA3AE", "#4A5059", "#1D2025", "#6B737D"], panel: ["#3A3F46", "#121417"], ink: "#FFFFFF" },
};

const auras: Partial<Record<ProjectPlaqueKind, "gold" | "holo">> = {
  "weekly-top-1": "gold",
  "upvotes-500": "holo",
};

const monthNames = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

/** `2026-W46` → `SEMANA 46 · 2026`, `2026-11` → `NOVEMBRO 2026`. */
export function plaquePeriodLabel(period: string | null | undefined) {
  if (!period) return null;
  const week = /^(\d{4})-W(\d{2})$/.exec(period);
  if (week) return `SEMANA ${Number(week[2])} · ${week[1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month) return `${monthNames[Number(month[2]) - 1]} ${month[1]}`;
  return null;
}

/**
 * Ribbon treatments under review in the brand manual: the flag (blue with the
 * white-red-white stripe), plain white, or per-material colours.
 */
export const plaqueRibbonStyles = ["flag", "white", "material"] as const;
export type PlaqueRibbonStyle = (typeof plaqueRibbonStyles)[number];

type RibbonColors = { top: string; bottom: string; tail: string; text: string; stripes: boolean };

const COBALT_RIBBON: RibbonColors = { top: "#0B3FD9", bottom: "#022C9E", tail: "#022C9E", text: "#FFFFFF", stripes: false };
const WHITE_RIBBON: RibbonColors = { top: "#FFFFFF", bottom: "#E6EBF2", tail: "#C9D2DE", text: INK, stripes: false };

const materialRibbons: Record<ProjectPlaqueKind, RibbonColors> = {
  "weekly-top-1": COBALT_RIBBON,
  "weekly-top-3": COBALT_RIBBON,
  "weekly-top-10": COBALT_RIBBON,
  "upvotes-10": COBALT_RIBBON,
  "upvotes-50": { ...WHITE_RIBBON, text: "#0A2C8F" },
  "upvotes-100": { ...WHITE_RIBBON, text: "#0A2C8F" },
  "upvotes-500": { top: "#232A38", bottom: "#10141C", tail: "#10141C", text: "#FFFFFF", stripes: false },
  "staff-pick": { ...WHITE_RIBBON, text: "#06553A" },
  "project-of-month": COBALT_RIBBON,
  pioneer: { top: "#FF6A13", bottom: "#C2410C", tail: "#C2410C", text: "#FFFFFF", stripes: false },
};

function ribbonColors(style: PlaqueRibbonStyle, kind: ProjectPlaqueKind): RibbonColors {
  if (style === "white") return WHITE_RIBBON;
  if (style === "material") return materialRibbons[kind];
  return { top: "#1F5BFF", bottom: FLAG_BLUE, tail: FLAG_BLUE, text: "#FFFFFF", stripes: true };
}

/** White-red-white, in the flag's proportions (each stripe a twelfth of the height). */
function FlagStripes({ x, y, width, unit }: { x: number; y: number; width: number; unit: number }) {
  return (
    <>
      <rect x={x} y={y} width={width} height={unit} fill="#fff" />
      <rect x={x} y={y + unit} width={width} height={unit} fill={FLAG_RED} />
      <rect x={x} y={y + unit * 2} width={width} height={unit} fill="#fff" />
    </>
  );
}

/** Drawn on the enamel, under the symbol: what makes a blue panel read as Cabo Verde. */
function FlagField({ kind }: { kind: ProjectPlaqueKind }) {
  if (kind === "project-of-month") return <FlagStripes x={21} y={71} width={158} unit={6} />;
  return null;
}

const fallbackRibbon: Record<ProjectPlaqueKind, string> = {
  "weekly-top-1": "1º DA SEMANA",
  "weekly-top-3": "TOP 3 DA SEMANA",
  "weekly-top-10": "TOP 10 DA SEMANA",
  "upvotes-10": "APOIOS",
  "upvotes-50": "APOIOS",
  "upvotes-100": "APOIOS",
  "upvotes-500": "APOIOS",
  "staff-pick": "ESCOLHA DA EQUIPA",
  "project-of-month": "PROJETO DO MÊS",
  pioneer: "PIONEIRO",
};

const FONT = "Inter Variable, Inter, system-ui, sans-serif";
const ord = (
  <tspan fontSize="28" dy="-24" dx="1">
    º
  </tspan>
);

function Numeral({ y, size, children }: { y: number; size: number; children: ReactNode }) {
  return (
    <text x="100" y={y} textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize={size} letterSpacing="-2">
      {children}
    </text>
  );
}

function StarRing({
  cx,
  cy,
  r,
  size,
  fill,
  offset,
}: {
  cx: number;
  cy: number;
  r: number;
  size: number;
  fill: string;
  offset?: number;
}) {
  return (
    <>
      {starRing(cx, cy, r, offset).map(([x, y], i) => (
        <polygon
          key={i}
          className="project-plaque__star"
          style={{ "--plaque-star-delay": `${(i * 0.3).toFixed(1)}s` } as CSSProperties}
          points={star(x, y, size)}
          fill={fill}
        />
      ))}
    </>
  );
}

function PlaqueSymbol({
  kind,
  rank,
  number,
  period,
  play,
}: {
  kind: ProjectPlaqueKind;
  rank?: number;
  number?: number;
  period?: string | null;
  play: number;
}) {
  switch (kind) {
    case "weekly-top-1":
      return (
        <>
          {/* The crown only drops in on hover (see index.css): drawn at rest
              it was too fussy at sidebar size, so the plaque is just 1º. */}
          <g className="project-plaque__crown">
            <path d="M82 54 L84 37 L92 45 L100 31 L108 45 L116 37 L118 54 Z" />
            <rect x="82" y="54" width="36" height="4.5" rx="1.5" />
            <circle cx="100" cy="31" r="2.8" fill={FLAG_RED} />
            <circle cx="84" cy="37" r="2.2" fill={COBALT} />
            <circle cx="116" cy="37" r="2.2" fill={COBALT} />
          </g>
          <g className="project-plaque__lift">
            <Numeral y={106} size={66}>
              1
              <tspan fontSize="32" dy="-30" dx="2">
                º
              </tspan>
            </Numeral>
          </g>
        </>
      );
    case "weekly-top-3":
    case "weekly-top-10":
      return (
        <>
          {/* Podium: one block, the middle step highest. On hover the place
              rolls over like a scoreboard and the podium takes the landing. */}
          <path className="project-plaque__podium" opacity=".9" d="M64 44 H86 V32 H114 V50 H136 V62 H64 Z" />
          <g className="project-plaque__rank">
            <Numeral y={124} size={62}>
              {rank ?? (kind === "weekly-top-3" ? 3 : 10)}
              {ord}
            </Numeral>
          </g>
          <path className="project-plaque__pop" d={spark(50, 86, 7)} style={{ animationDelay: ".42s" }} />
          <path className="project-plaque__pop" d={spark(150, 80, 6)} style={{ animationDelay: ".5s" }} />
          <path className="project-plaque__pop" d={spark(146, 114, 4.5)} style={{ animationDelay: ".58s" }} />
        </>
      );
    case "upvotes-10":
    case "upvotes-50":
    case "upvotes-100":
    case "upvotes-500": {
      const value = number ?? Number(kind.split("-")[1]);
      return (
        <>
          {/* lucide ArrowBigUp, the same arrow as the vote button. On hover it
              launches; from 100 up it fires a flame and bursts at the top. */}
          {value >= 100 && (
            <Burst
              cx={100}
              cy={46}
              colors={kind === "upvotes-500" ? ["#59F3FF", "#FF7AD9", "#FFD66B", "#FFFFFF"] : ["#F7D116", "#FFFFFF"]}
            />
          )}
          <g className="project-plaque__launch">
            {value >= 100 && (
              <g className="project-plaque__flame">
                <path d="M90 80 Q100 108 110 80 Z" fill="#FF8A1F" />
                <path d="M95 80 Q100 96 105 80 Z" fill="#FFE08A" />
              </g>
            )}
            <g className="project-plaque__arrow">
              <path d="M100 30 L128 62 Q130 65 126 65 L112 65 L112 76 Q112 79 109 79 L91 79 Q88 79 88 76 L88 65 L74 65 Q70 65 72 62 Z" />
            </g>
          </g>
          <circle className="project-plaque__rise" cx="62" cy="88" r="2.6" opacity=".8" style={{ animationDelay: ".2s" }} />
          <circle className="project-plaque__rise" cx="140" cy="92" r="2.2" opacity=".8" style={{ animationDelay: "1.1s" }} />
          <circle className="project-plaque__rise" cx="150" cy="70" r="1.8" opacity=".8" style={{ animationDelay: "1.8s" }} />
          <Numeral y={124} size={value >= 100 ? 40 : 46}>
            <CountUp value={value} play={play} />
          </Numeral>
        </>
      );
    }
    case "staff-pick":
      return (
        <>
          {/* On hover the H splits and snaps back like the site logo, then the
              seal pops and its check is drawn again. */}
          <HMark x={66} y={34} width={68} height={80} animated />
          <g className="project-plaque__seal">
            <circle cx="136" cy="104" r="14" fill="#F2C14E" stroke="#fff" strokeWidth="3" />
            <path
              className="project-plaque__check"
              pathLength={1}
              d="M129.5 104 l4.5 4.5 8.5 -9.5"
              fill="none"
              stroke="#06553A"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <path className="project-plaque__twinkle" d={spark(52, 52, 7)} fill="#fff" style={{ animationDelay: ".8s" }} />
        </>
      );
    case "project-of-month":
    {
      // The flag re-centred on the plaque: as on the real flag the ring is
      // centred on the red stripe, and the month sits inside it. The blue
      // outline keeps the white figure legible over the white stripes.
      // On hover the stars chase each other around the number.
      const month = number ?? Number(/^\d{4}-(\d{2})$/.exec(period ?? "")?.[1] ?? Number.NaN);
      return (
        <>
          <g className="project-plaque__orbit">
            <StarRing cx={100} cy={80} r={42} size={6} fill={FLAG_YELLOW} />
          </g>
          {Number.isFinite(month) && (
            <text
              x="100"
              y="98"
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight="700"
              fontSize="50"
              letterSpacing="-2"
              stroke={FLAG_BLUE}
              strokeWidth="7"
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {month}
            </text>
          )}
        </>
      );
    }
    case "pioneer":
      return (
        <>
          <path d="M78 36 V120" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          {/* The flag waves on hover: index.css animates the path shape. */}
          <path className="project-plaque__flag" d="M81 40 Q100 32 112 40 T140 42 V78 Q126 86 112 78 T81 76 Z" fill="#FF6A13" />
          <path className="project-plaque__flag project-plaque__lava" d="M81 40 Q100 32 112 40 T140 42 V78 Q126 86 112 78 T81 76 Z" fill="none" stroke="#FFD27A" strokeWidth="2" />
          {number !== undefined && (
            <text x="114" y="118" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="28">
              #{number}
            </text>
          )}
        </>
      );
  }
}

/**
 * One project achievement. `period` is a week (`2026-W46`) or month
 * (`2026-11`) and becomes the ribbon text; `rank` is the exact weekly place
 * for top-3 and top-10; `number` is the launch order for pioneer, or overrides the upvote figure.
 *
 * The plaque tilts toward the pointer. An ancestor with `.plaque-intro` plays
 * the drop-in entry (stagger it with `--plaque-intro-delay`).
 */
export function ProjectPlaque({
  kind,
  period,
  rank,
  number,
  ribbon: ribbonStyle = "flag",
  className,
}: {
  kind: ProjectPlaqueKind;
  /** Ribbon treatment; the brand manual compares all three. */
  ribbon?: PlaqueRibbonStyle;
  period?: string | null;
  rank?: number;
  number?: number;
  className?: string;
}) {
  const id = `plaque${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const material = materials[kind];
  const ribbon = plaquePeriodLabel(period) ?? fallbackRibbon[kind];
  const rib = ribbonColors(ribbonStyle, kind);
  // Bumped on every hover so the upvote count runs again.
  const [play, setPlay] = useState(0);

  function tilt(event: PointerEvent<HTMLSpanElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    event.currentTarget.style.setProperty("--plaque-rx", `${(-y * 22).toFixed(1)}deg`);
    event.currentTarget.style.setProperty("--plaque-ry", `${(x * 22).toFixed(1)}deg`);
  }

  function untilt(event: PointerEvent<HTMLSpanElement>) {
    event.currentTarget.style.removeProperty("--plaque-rx");
    event.currentTarget.style.removeProperty("--plaque-ry");
  }

  return (
    <span
      className={cn("project-plaque relative inline-block size-32 shrink-0", className)}
      data-kind={kind}
      data-aura={auras[kind]}
      onPointerEnter={() => setPlay((n) => n + 1)}
      onPointerMove={tilt}
      onPointerLeave={untilt}
    >
      <span className="project-plaque__body block size-full">
        <svg viewBox="0 0 200 200" className="block size-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
              {material.frame.map((color, i) => (
                <stop key={i} offset={[0, 0.35, 0.7, 1][i]} stopColor={color} />
              ))}
            </linearGradient>
            {material.panel ? (
              <radialGradient id={`${id}-p`} cx=".35" cy=".25" r="1">
                <stop stopColor={material.panel[0]} />
                <stop offset="1" stopColor={material.panel[1]} />
              </radialGradient>
            ) : (
              <linearGradient id={`${id}-p`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#3A7BFF" />
                <stop offset=".3" stopColor="#9B5CFF" />
                <stop offset=".55" stopColor="#FF5FA2" />
                <stop offset=".8" stopColor="#FFB547" />
                <stop offset="1" stopColor="#24C8D8" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="rotate"
                  from="0 .5 .5"
                  to="360 .5 .5"
                  dur="9s"
                  repeatCount="indefinite"
                />
              </linearGradient>
            )}
            <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor={rib.top} />
              <stop offset="1" stopColor={rib.bottom} />
            </linearGradient>
            <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#fff" stopOpacity="0" />
              <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <pattern id={`${id}-d`} width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="1" fill="#fff" opacity=".16" />
            </pattern>
            <clipPath id={`${id}-c`}>
              <rect x="8" y="8" width="184" height="184" rx="40" />
            </clipPath>
            <clipPath id={`${id}-pc`}>
              <rect x="21" y="21" width="158" height="158" rx="29" />
            </clipPath>
            <clipPath id={`${id}-rc`}>
              <rect x="14" y="134" width="172" height="38" rx="5" />
            </clipPath>
            <filter id={`${id}-e`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.2" floodColor="#000" floodOpacity=".35" />
            </filter>
          </defs>

          {/* Frame and enamel panel */}
          <rect x="8" y="8" width="184" height="184" rx="40" fill={`url(#${id}-f)`} />
          <rect x="9.5" y="9.5" width="181" height="181" rx="38.5" fill="none" stroke="#fff" strokeOpacity=".7" />
          <rect x="21" y="21" width="158" height="158" rx="29" fill={`url(#${id}-p)`} />
          <g clipPath={`url(#${id}-pc)`}>
            <FlagField kind={kind} />
          </g>
          <rect x="21" y="21" width="158" height="158" rx="29" fill={`url(#${id}-d)`} />
          <rect x="21" y="21" width="158" height="158" rx="29" fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="2" />

          <g filter={`url(#${id}-e)`} fill={material.ink}>
            <PlaqueSymbol kind={kind} rank={rank} number={number} period={period} play={play} />
          </g>

          {/* Ribbon; the flag style adds the white-red-white stripe along its foot */}
          <polygon points="2,136 20,140 20,172 2,176 11,156" fill={rib.tail} />
          <polygon points="198,136 180,140 180,172 198,176 189,156" fill={rib.tail} />
          <polygon points="14,140 20,140 20,146" fill="#000" opacity=".35" />
          <polygon points="186,140 180,140 180,146" fill="#000" opacity=".35" />
          <g clipPath={`url(#${id}-rc)`}>
            <rect x="14" y="134" width="172" height="38" fill={`url(#${id}-r)`} />
            {rib.stripes && <FlagStripes x={14} y={162} width={172} unit={2.5} />}
          </g>
          <rect x="14" y="134" width="172" height="38" rx="5" fill="none" stroke="#fff" strokeOpacity=".35" />
          <text
            x="100"
            y={rib.stripes ? 154 : 157.5}
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight="700"
            fontSize={ribbon.length > 16 ? 11.5 : 13}
            letterSpacing="1.4"
            fill={rib.text}
          >
            {ribbon}
          </text>

          {/* Hallmark: the Hub H, stamped on the top edge of every plaque */}
          <rect x="85" y="1" width="30" height="28" rx="8" fill={INK} stroke={`url(#${id}-f)`} strokeWidth="2.5" />
          <HMark x={91.5} y={6} width={17} height={18} fill="#fff" />

          <g clipPath={`url(#${id}-c)`} pointerEvents="none">
            <g transform="rotate(20 100 100)">
              <rect className="project-plaque__glint" x="-10" y="-30" width="46" height="270" fill={`url(#${id}-s)`} />
            </g>
          </g>
        </svg>
      </span>
    </span>
  );
}
