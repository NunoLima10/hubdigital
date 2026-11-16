/*
 * The animations for the onboarding achievement reveal. Everyone gets
 * DEFAULT_REVEAL (Encaixe); the others stay to compare in the playground
 * (/playground/onboarding), which stores a pick for this browser, and
 * `?reveal=<id>` forces one on the real onboarding screen.
 */

export const revealVariants = [
  {
    id: "sequence",
    name: "A · Sequência",
    description: "A medalha gira e aterra, um brilho acende, e o texto entra linha a linha.",
  },
  {
    id: "drop",
    name: "B · Queda",
    description: "A medalha cai do alto, bate no card com ressalto e onda de choque, e o confetti sai do impacto.",
  },
  {
    id: "dock",
    name: "C · Encaixe",
    description: "A medalha aparece primeiro, a girar no lugar do perfil; o perfil surge e a medalha voa para o canto dele, no lugar do visto. O card fica pequeno, com a medalha numerada ao lado do texto.",
  },
  {
    id: "calm",
    name: "D · Calma",
    description: "Tudo aparece com um fade suave, sem confetti nem decoração animada.",
  },
] as const;

export type RevealVariant = (typeof revealVariants)[number]["id"];

/** What everyone sees on onboarding unless a variant is forced. */
export const DEFAULT_REVEAL: RevealVariant = "dock";

const STORAGE_KEY = "hubdigital-reveal-variant";
const isVariant = (value: unknown): value is RevealVariant =>
  revealVariants.some((variant) => variant.id === value);

/** The forced variant (`?reveal=` first, then the playground's pick), or the default. */
export function getRevealVariant(): RevealVariant {
  if (typeof window === "undefined") return DEFAULT_REVEAL;
  const fromUrl = new URLSearchParams(window.location.search).get("reveal");
  if (isVariant(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isVariant(stored)) return stored;
  } catch {
    // Storage blocked: fall back to the default.
  }
  return DEFAULT_REVEAL;
}

export function setRevealVariant(variant: RevealVariant) {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    // Storage blocked: the choice only lasts for this page.
  }
}
