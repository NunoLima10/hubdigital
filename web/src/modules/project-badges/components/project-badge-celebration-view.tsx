import { DockReveal, DOCK_IMPACT_MS } from "@/components/badge/dock-reveal";
import {
  ProjectPlaque,
  plaquePeriodLabel,
} from "@/components/project-badge/project-plaque";
import { buttonVariants } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  projectBadgeCatalog,
  type ProjectBadgeKey,
  type UnseenProjectBadge,
} from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { BarChart3, ExternalLink } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

/**
 * Each plaque's signature colour, taken from its enamel panel in
 * project-plaque.tsx, for the shockwave and the card's tint.
 */
const plaqueTints: Record<ProjectBadgeKey, string> = {
  "weekly-top-1": "#F2BC45",
  "weekly-top-3": "#AAB4C3",
  "weekly-top-10": "#C97C3F",
  "upvotes-10": "#3E80FF",
  "upvotes-50": "#3E80FF",
  "upvotes-100": "#2346D8",
  "upvotes-500": "#A78BFA",
  "staff-pick": "#17B07A",
  "project-of-month": "#1F5BFF",
  pioneer: "#8A939E",
};

const plaqueProps = (award: UnseenProjectBadge) => ({
  kind: award.key,
  period: award.period,
  rank: award.rank ?? undefined,
  number: award.key === "pioneer" ? (award.rank ?? undefined) : undefined,
});

const CONFETTI_Z = 1400;

/**
 * The party around the landing: cannons from both sides of the screen. The
 * plaque's own burst comes from DockReveal.
 * Returns a cleanup that cancels anything still scheduled.
 */
function celebrateScreen(tint: string) {
  if (prefersReducedMotion()) return () => {};
  const colors = [tint, "#2563eb", "#4d7fff", "#f6c445", "#e23d3d", "#ffffff"];
  const timers: number[] = [];
  const at = (ms: number, fire: () => void) => timers.push(window.setTimeout(fire, ms));

  // Side cannons, a second volley right behind the first.
  for (const [ms, count] of [[0, 55], [200, 30]] as const) {
    at(DOCK_IMPACT_MS + ms, () => {
      confetti({ particleCount: count, angle: 60, spread: 55, startVelocity: 55, origin: { x: 0, y: 0.8 }, colors, zIndex: CONFETTI_Z });
      confetti({ particleCount: count, angle: 120, spread: 55, startVelocity: 55, origin: { x: 1, y: 0.8 }, colors, zIndex: CONFETTI_Z });
    });
  }

  return () => timers.forEach((timer) => window.clearTimeout(timer));
}

/** Start time for the parts that follow the plaque's landing. */
const after = (ms: number) => ({ animationDelay: `${ms}ms` }) as CSSProperties;

/**
 * The full-screen moment for a project achievement, shaped like onboarding's
 * "Encaixe": the plaque spins in large, the project's logo appears, the plaque
 * lands on its corner, then a small card names the achievement. It only
 * draws; the caller decides what closing does (mark as seen, or nothing in
 * the playground).
 */
export function ProjectBadgeCelebrationView({
  award,
  open,
  onClose,
  position,
}: {
  award: UnseenProjectBadge;
  open: boolean;
  onClose: () => void;
  /** "2 de 3" when several are queued. */
  position?: { index: number; total: number };
}) {
  const badge = projectBadgeCatalog[award.key];
  const tint = plaqueTints[award.key];
  const period = plaquePeriodLabel(award.period);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cancel = celebrateScreen(tint);
    return () => {
      cancel();
      confetti.reset();
    };
  }, [open, tint]);

  const logo = (
    <span className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border bg-muted text-3xl font-semibold text-muted-foreground shadow-sm">
      {award.project.logoUrl && !logoFailed ? (
        <img
          src={award.project.logoUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        award.project.name[0]?.toUpperCase()
      )}
    </span>
  );

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[1300] bg-background/75 backdrop-blur-md transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-[1300] flex overflow-y-auto px-4 py-10 outline-none transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
          style={{ "--badge-tint": tint } as CSSProperties}
        >
          <div className="m-auto flex w-full max-w-md flex-col items-center text-center">
            <DialogPrimitive.Title className="sr-only">
              {`${award.project.name} ganhou a conquista ${badge.name}`}
            </DialogPrimitive.Title>

            <p
              className="mb-8 text-xs font-semibold tracking-wide uppercase animate-in fade-in-0 duration-500 [animation-fill-mode:backwards]"
              style={{ color: `color-mix(in oklab, ${tint} 65%, var(--foreground))` }}
            >
              Nova conquista do projeto
              {position && position.total > 1 ? ` · ${position.index} de ${position.total}` : ""}
            </p>

            <DockReveal
              tint={tint}
              confettiZIndex={CONFETTI_Z}
              label="Ver outra vez"
              piece={<ProjectPlaque {...plaqueProps(award)} className="size-full" />}
            >
              {logo}
            </DockReveal>

            <h2
              className="mt-6 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl animate-in fade-in-0 slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
              style={after(1450)}
            >
              {award.project.name}
            </h2>

            <div
              className="badge-reveal-card badge-reveal-card--strong mt-6 flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left animate-in fade-in-0 zoom-in-95 duration-500 [animation-fill-mode:backwards]"
              style={{ ...after(DOCK_IMPACT_MS - 150), "--badge-tint": tint } as CSSProperties}
            >
              <span
                className="plaque-intro shrink-0"
                style={{ "--plaque-intro-delay": `${DOCK_IMPACT_MS}ms` } as CSSProperties}
              >
                <ProjectPlaque {...plaqueProps(award)} className="size-20" />
              </span>
              <div className="min-w-0">
                <p className="badge-reveal__eyebrow text-xs font-semibold tracking-wide uppercase">
                  {period ?? "Conquista"}
                </p>
                <p className="mt-1 text-base font-semibold">{badge.name}</p>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                  {badge.description}
                </p>
              </div>
            </div>

            <div
              className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
              style={after(DOCK_IMPACT_MS + 600)}
            >
              <Link
                to="/projects/$slug"
                params={{ slug: award.project.slug }}
                onClick={onClose}
                className={cn(buttonVariants(), "sm:w-auto")}
              >
                <ExternalLink />
                Ver projeto
              </Link>
              <Link
                to="/dashboard/metrics"
                onClick={onClose}
                className={cn(buttonVariants({ variant: "outline" }), "sm:w-auto")}
              >
                <BarChart3 />
                Ver estatísticas
              </Link>
              <DialogPrimitive.Close className={cn(buttonVariants({ variant: "ghost" }), "sm:w-auto")}>
                {position && position.index < position.total ? "Seguinte" : "Continuar"}
              </DialogPrimitive.Close>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
