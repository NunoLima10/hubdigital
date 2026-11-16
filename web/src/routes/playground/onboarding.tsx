import { BrandLogo } from "@/components/brand-logo/brand-logo";
import {
  revealVariants,
  setRevealVariant,
  getRevealVariant,
  DEFAULT_REVEAL,
  type RevealVariant,
} from "@/components/badge/reveal-variants";
import { Button } from "@/components/ui/button";
import { privatePageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { OnboardingSuccess } from "@/modules/onboarding/components/onboarding-success/onboarding-success";
import { badgeDefinitions, type BadgeKey } from "@hubdigital/shared";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/playground/onboarding")({
  head: () => privatePageHead("Playground do onboarding"),
  component: OnboardingPlayground,
});

/**
 * The onboarding welcome screen with a fake result, to compare the reveal
 * animations. The page is laid out exactly like the real one; the controls
 * float in a corner so they don't move it. The pick is remembered, so the
 * real onboarding plays it too.
 */
function OnboardingPlayground() {
  const [reveal, setReveal] = useState<RevealVariant>(DEFAULT_REVEAL);
  const [badgeKey, setBadgeKey] = useState<BadgeKey>("founding-silver");
  const [run, setRun] = useState(0);
  const [open, setOpen] = useState(true);

  // Read after mount: storage and the URL only exist in the browser.
  useEffect(() => setReveal(getRevealVariant()), []);

  const replay = () => setRun((value) => value + 1);

  function pick(variant: RevealVariant) {
    setReveal(variant);
    setRevealVariant(variant);
    replay();
  }

  const current = revealVariants.find((variant) => variant.id === reveal);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_45%)] px-4 py-12">
        <div key={`${reveal}-${badgeKey}-${run}`} className="flex w-full flex-col items-center">
          <div className="mb-8 flex flex-col items-center gap-1.5 text-center animate-in fade-in-0 slide-in-from-top-2 duration-700 [animation-fill-mode:backwards]">
            <BrandLogo className="text-base" />
            <p className="text-sm text-muted-foreground">Feito em Cabo Verde, para o mundo.</p>
          </div>
          <OnboardingSuccess
            result={{
              profileResponse: "student",
              objectiveResponse: "explore",
              membershipNumber: 26,
              badges: [badgeKey],
            }}
            ready
            reveal={reveal}
            preview
          />
        </div>
      </main>

      {/* Fixed to the corner so the page underneath keeps its real layout. */}
      <aside className="fixed top-4 left-4 z-50">
        {open ? (
          <div className="flex w-56 flex-col gap-3 rounded-xl border bg-card/90 p-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Animação
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                aria-label="Esconder controlos"
                onClick={() => setOpen(false)}
              >
                <ChevronLeft />
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              {revealVariants.map((variant) => (
                <Button
                  key={variant.id}
                  size="sm"
                  variant={variant.id === reveal ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => pick(variant.id)}
                >
                  {variant.name}
                  {variant.id === DEFAULT_REVEAL && (
                    <span className="ml-auto text-[11px] font-normal opacity-70">padrão</span>
                  )}
                </Button>
              ))}
            </div>

            <p className="text-xs leading-5 text-pretty text-muted-foreground">
              {current?.description}
            </p>

            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Conquista
              <select
                value={badgeKey}
                onChange={(event) => {
                  setBadgeKey(event.target.value as BadgeKey);
                  replay();
                }}
                className="h-8 rounded-md border bg-background px-2 text-base md:text-sm text-foreground"
              >
                {badgeDefinitions.map((badge) => (
                  <option key={badge.key} value={badge.key}>
                    {badge.name} · {badge.material}
                  </option>
                ))}
              </select>
            </label>

            <Button size="sm" variant="secondary" onClick={replay}>
              <RotateCcw />
              Repetir
            </Button>

            <p className={cn("text-[11px] leading-4 text-muted-foreground")}>
              A escolha fica guardada neste browser e o onboarding real passa a
              usá-la; os outros veem a padrão. Também podes forçar com{" "}
              <code>?reveal={reveal}</code>.
            </p>
          </div>
        ) : (
          <Button
            size="icon"
            variant="outline"
            className="shadow-lg"
            aria-label="Mostrar controlos"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontal />
          </Button>
        )}
      </aside>
    </>
  );
}
