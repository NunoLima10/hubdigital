import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import satori from "satori";

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

export type ShareImageInput = {
  name: string;
  tagline: string;
  category?: string | null;
  upvoteCount?: number;
  // Already-fetched images as data URIs; a missing one falls back to a monogram
  // or a text-only layout, so a slow bucket never blocks the card.
  logo?: string | null;
  cover?: string | null;
};

const colors = {
  background: "#0a0a0a",
  surface: "#171717",
  border: "#262626",
  text: "#fafafa",
  muted: "#a3a3a3",
  accent: "#3b82f6",
};

// Satori takes a React-like tree; plain objects avoid pulling React into the API.
type Element = { type: string; props: Record<string, unknown> };

function h(
  type: string,
  style: Record<string, unknown>,
  children?: Element | string | (Element | string | null | false)[],
  props: Record<string, unknown> = {},
): Element {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;
  return { type, props: { ...props, style, children: list } };
}

// The H mark from brand/logo-h.svg, white on the card background.
const brandMark = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="110 105 140 150"><g fill="#fff"><path d="M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z"/><path d="M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z"/><path d="M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z"/></g></svg>`,
).toString("base64")}`;

let fonts: { name: string; data: Buffer; weight: 400 | 600 | 800; style: "normal" }[] | undefined;

// Satori cannot read woff2 or variable fonts, hence the static woff files.
function loadFonts() {
  fonts ??= ([400, 600, 800] as const).map((weight) => ({
    name: "Inter",
    data: readFileSync(
      require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`),
    ),
    weight,
    style: "normal" as const,
  }));
  return fonts;
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function monogram(name: string) {
  const letters = name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "H";
}

function logoBlock(input: ShareImageInput, size: number) {
  const frame = {
    width: size,
    height: size,
    borderRadius: size * 0.22,
    border: `2px solid ${colors.border}`,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  };
  if (input.logo) {
    return h("div", frame, h("img", { width: size, height: size, objectFit: "cover" }, undefined, {
      src: input.logo,
      width: size,
      height: size,
    }));
  }
  return h(
    "div",
    { ...frame, fontSize: size * 0.4, fontWeight: 800, color: colors.text },
    monogram(input.name),
  );
}

// The upvote arrow, drawn as an image: the latin Inter subset has no ▲ glyph.
const upvoteIcon = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff"><path d="M12 3 3 13h5.5v8h7v-8H21z"/></svg>`,
).toString("base64")}`;

function chip(text: string, accent = false) {
  return h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 18px",
      borderRadius: 999,
      fontSize: 24,
      fontWeight: 600,
      color: accent ? colors.text : colors.muted,
      backgroundColor: accent ? colors.accent : colors.surface,
      border: `1px solid ${accent ? colors.accent : colors.border}`,
    },
    accent
      ? [h("img", { width: 22, height: 22 }, undefined, { src: upvoteIcon, width: 22, height: 22 }), text]
      : text,
  );
}

function header() {
  return h("div", { display: "flex", alignItems: "center", justifyContent: "space-between" }, [
    h("div", { display: "flex", alignItems: "center", gap: 14 }, [
      h("img", { width: 40, height: 40 }, undefined, { src: brandMark, width: 40, height: 40 }),
      h("div", { fontSize: 28, fontWeight: 800, color: colors.text }, "Hub Digital"),
    ]),
    h("div", { fontSize: 24, color: colors.muted }, "hubdigital.cv"),
  ]);
}

function projectCard(input: ShareImageInput) {
  const hasCover = Boolean(input.cover);
  const votes = input.upvoteCount ?? 0;
  const chips = [
    input.category ? chip(input.category) : null,
    votes > 0 ? chip(`${votes} ${votes === 1 ? "voto" : "votos"}`, true) : null,
  ];

  const text = h(
    "div",
    { display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 24 },
    [
      logoBlock(input, 104),
      h(
        "div",
        {
          fontSize: hasCover ? 60 : 72,
          fontWeight: 800,
          color: colors.text,
          lineHeight: 1.05,
          letterSpacing: -1.5,
        },
        truncate(input.name, hasCover ? 40 : 48),
      ),
      h(
        "div",
        { fontSize: hasCover ? 28 : 32, color: colors.muted, lineHeight: 1.35 },
        truncate(input.tagline, hasCover ? 110 : 140),
      ),
      h("div", { display: "flex", gap: 12, marginTop: "auto" }, chips),
    ],
  );

  const cover = input.cover
    ? h(
        "div",
        {
          display: "flex",
          width: 470,
          height: 420,
          borderRadius: 28,
          overflow: "hidden",
          border: `2px solid ${colors.border}`,
          flexShrink: 0,
        },
        h("img", { width: 470, height: 420, objectFit: "cover" }, undefined, {
          src: input.cover,
          width: 470,
          height: 420,
        }),
      )
    : null;

  return h("div", { display: "flex", flex: 1, gap: 48, marginTop: 36 }, [text, cover]);
}

const PADDING_X = 64;
const PADDING_Y = 52;

function frame(children: Element[]) {
  // Satori adds padding to an explicit size, so the canvas carries the size and
  // an inner box of the remaining size carries the content.
  return h(
    "div",
    {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      display: "flex",
      backgroundColor: colors.background,
      backgroundImage: `radial-gradient(circle at 100% 0%, rgba(59,130,246,0.22), transparent 55%)`,
      fontFamily: "Inter",
    },
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        top: PADDING_Y,
        left: PADDING_X,
        width: SHARE_IMAGE_WIDTH - PADDING_X * 2,
        height: SHARE_IMAGE_HEIGHT - PADDING_Y * 2,
      },
      children,
    ),
  );
}

async function toPng(tree: Element) {
  // Satori's typings ask for a ReactNode; the plain tree is what it consumes.
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    fonts: loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: SHARE_IMAGE_WIDTH } })
    .render()
    .asPng();
}

export function renderProjectShareImage(input: ShareImageInput) {
  return toPng(frame([header(), projectCard(input)]));
}

/** The site-wide card, used when a page has nothing more specific to show. */
export function renderSiteShareImage() {
  return toPng(
    frame([
      header(),
      h("div", { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 28 }, [
        h(
          "div",
          { fontSize: 84, fontWeight: 800, color: colors.text, lineHeight: 1.05, letterSpacing: -2 },
          "Feito em Cabo Verde.",
        ),
        h(
          "div",
          { fontSize: 36, color: colors.muted, lineHeight: 1.35, maxWidth: 900 },
          "Descobre, partilha e apoia os projetos e produtos digitais criados por cabo-verdianos.",
        ),
      ]),
    ]),
  );
}
