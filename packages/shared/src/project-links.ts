import { z } from "zod";

export const projectLinkKindValues = [
  "website",
  "app_store",
  "repository",
  "demo",
  "documentation",
  "other",
] as const;
export type ProjectLinkKind = (typeof projectLinkKindValues)[number];
export const projectLinkKindLabels: Record<ProjectLinkKind, string> = {
  website: "Website",
  app_store: "Loja de aplicações",
  repository: "Código-fonte",
  demo: "Demonstração",
  documentation: "Documentação",
  other: "Outro",
};
export const projectDraftLinkSchema = z.object({
  id: z.number().int().positive().optional(),
  kind: z.enum(projectLinkKindValues),
  url: z.string().max(2048),
  label: z.string().trim().max(80).optional(),
  isPrimary: z.boolean().default(false),
  referralAttribution: z.boolean().default(false),
});
export type ProjectLinkInput = z.input<typeof projectDraftLinkSchema>;

/** Produce an executable HTTP(S) destination; reject other schemes and credentials. */
export function projectLinkHref(link: Pick<ProjectLinkInput, "kind" | "url">): string | null {
  const input = link.url.trim();
  if (!input || /[\r\n\x00]/.test(input)) return null;
  if (input.startsWith("//")) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(candidate);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export const projectLinkSchema = projectDraftLinkSchema.superRefine((link, context) => {
  if (!projectLinkHref(link))
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: "Indica um endereço HTTP ou HTTPS válido, sem credenciais.",
    });
});

export type ProjectAppStore = "apple" | "google_play";
const appStoreLabels: Record<ProjectAppStore, string> = { apple: "App Store", google_play: "Google Play" };

/** Recognise the store behind an app_store link from its host; null for other stores or kinds. */
export function projectAppStore(link: Pick<ProjectLinkInput, "kind" | "url">): ProjectAppStore | null {
  if (link.kind !== "app_store") return null;
  const href = projectLinkHref(link);
  if (!href) return null;
  const host = new URL(href).hostname.replace(/^www\./, "");
  if (host === "apps.apple.com" || host === "itunes.apple.com") return "apple";
  if (host === "play.google.com") return "google_play";
  return null;
}

/** Secondary-link text: the builder's label, else the recognised store, else the kind. */
export function projectLinkDisplayLabel(link: Pick<ProjectLinkInput, "kind" | "url" | "label">) {
  if (link.label) return link.label;
  const store = projectAppStore(link);
  return store ? appStoreLabels[store] : projectLinkKindLabels[link.kind];
}

export function primaryProjectLink<T extends ProjectLinkInput>(links: T[]): T | undefined {
  return links.find((link) => link.isPrimary && projectLinkHref(link));
}

export function projectLinkActionLabel(
  link: Pick<ProjectLinkInput, "kind" | "label">,
  availability?: string | null,
) {
  if (availability === "waitlist") return "Entrar na lista";
  if (availability === "invite_only") return "Pedir acesso";
  const labels: Record<ProjectLinkKind, string> = {
    website: "Experimentar",
    app_store: "Instalar",
    repository: "Ver código",
    demo: "Ver demonstração",
    documentation: "Ler documentação",
    other: "Abrir link",
  };
  return link.label || labels[link.kind];
}

/** Opt-in attribution only on plain website URLs; never rewrite signed/query URLs. */
export function projectLinkReferralHref(link: ProjectLinkInput): string | null {
  const href = projectLinkHref(link);
  if (!href || !link.referralAttribution || link.kind !== "website") return href;
  const url = new URL(href);
  if (url.search) return href;
  url.searchParams.set("utm_source", "hubdigital");
  url.searchParams.set("utm_medium", "referral");
  return url.href;
}
