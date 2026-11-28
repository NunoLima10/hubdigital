import { BadgeMedal } from "@/components/badge/badge-medal";
import { ProjectPlaque } from "@/components/project-badge/project-plaque";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OnboardingSuccess } from "@/modules/onboarding/components/onboarding-success/onboarding-success";
import { ProjectBadgeCelebrationView } from "@/modules/project-badges/components/project-badge-celebration-view";
import { sampleProjectBadgeAward } from "@/modules/project-badges/sample-award";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  projectBadgeCatalog,
  projectBadgeKeyValues,
  type ProjectBadgeKey,
} from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { FlaskConical, Play, X } from "lucide-react";
import { useState, type ReactNode } from "react";

/** A celebration moment: a still of its last frame, what it is, how to see it. */
function MomentCard({
  still,
  title,
  status,
  children,
  actions,
}: {
  still: ReactNode;
  title: string;
  status: "live" | "testing";
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex h-44 items-center justify-center border-b bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_65%)]">
        {still}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{title}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              status === "live"
                ? "bg-primary text-primary-foreground"
                : "border text-muted-foreground",
            )}
          >
            {status === "live" ? "No ar" : "Em teste"}
          </span>
        </div>
        <div className="text-sm leading-6 text-pretty text-muted-foreground">{children}</div>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">{actions}</div>
      </div>
    </article>
  );
}

/** The subject with its piece docked in the corner, as the "Encaixe" ends. */
function DockedStill({ subject, piece, round }: { subject: ReactNode; piece: ReactNode; round: boolean }) {
  return (
    <span className="relative block">
      <span
        className={cn(
          "flex size-24 items-center justify-center bg-muted text-3xl font-semibold text-muted-foreground",
          round ? "rounded-full ring-4 ring-primary-soft ring-offset-4 ring-offset-card" : "rounded-3xl border",
        )}
      >
        {subject}
      </span>
      <span className="absolute -right-1.5 -bottom-1.5 size-10 drop-shadow-md">{piece}</span>
    </span>
  );
}

/** The onboarding welcome screen in a full-screen overlay, as a preview. */
function WelcomePreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[1300] bg-background/85 backdrop-blur-md" />
        <DialogPrimitive.Popup className="fixed inset-0 z-[1300] flex overflow-y-auto px-4 py-12 outline-none">
          <DialogPrimitive.Title className="sr-only">Pré-visualização das boas-vindas</DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="fixed top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-muted"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
          <div className="m-auto w-full">
            <OnboardingSuccess
              result={{
                profileResponses: ["student"],
                objectiveResponses: ["explore"],
                membershipNumber: 26,
                badges: ["founding-silver"],
              }}
              ready
              reveal="dock"
              preview
            />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The full-screen moments that mark an achievement. Each card shows the last
 * frame and opens the real component with sample data: nothing is saved.
 * The playgrounds stay as the place to compare variants.
 */
export function CelebrationShowcase() {
  const [plaque, setPlaque] = useState<ProjectBadgeKey>("staff-pick");
  const [showingProject, setShowingProject] = useState(false);
  const [showingWelcome, setShowingWelcome] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <MomentCard
          title="Conquista de projeto"
          status="live"
          still={
            <DockedStill
              round={false}
              subject="M"
              piece={<ProjectPlaque kind={plaque} className="size-full" />}
            />
          }
          actions={
            <>
              <select
                aria-label="Placa"
                value={plaque}
                onChange={(event) => setPlaque(event.target.value as ProjectBadgeKey)}
                className="h-8 rounded-md border bg-background px-2 text-base md:text-sm"
              >
                {projectBadgeKeyValues.map((key) => (
                  <option key={key} value={key}>
                    {projectBadgeCatalog[key].name}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => setShowingProject(true)}>
                <Play />
                Ver celebração
              </Button>
            </>
          }
        >
          Aparece por cima do site, na visita seguinte do maker, quando um projeto seu ganha
          uma placa. A placa gira em grande, o logótipo aparece e a placa encaixa no canto,
          com confetti dos lados. O cartão leva a cor da placa.
        </MomentCard>

        <MomentCard
          title="Boas-vindas · Encaixe"
          status="live"
          still={
            <DockedStill
              round
              subject="A"
              piece={<BadgeMedal badgeKey="founding-silver" compact className="size-full" />}
            />
          }
          actions={
            <>
              <Button size="sm" onClick={() => setShowingWelcome(true)}>
                <Play />
                Ver celebração
              </Button>
              <Link
                to="/playground/onboarding"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                <FlaskConical />
                Comparar variantes
              </Link>
            </>
          }
        >
          O fim do onboarding para quem ganha um distintivo de fundador. A medalha gira no
          lugar do avatar e encaixa no canto, onde ficava o visto; o cartão por baixo mostra a
          medalha numerada. As outras três variantes ficam no playground para comparar.
        </MomentCard>
      </div>

      <p className="text-sm text-muted-foreground">
        As pré-visualizações usam dados de exemplo e não guardam nada. Para ver todas as placas
        lado a lado, abre o{" "}
        <Link to="/playground/project-badges" className="font-medium text-foreground underline underline-offset-4">
          playground de conquistas de projeto
        </Link>
        .
      </p>

      {showingProject && (
        <ProjectBadgeCelebrationView
          key={plaque}
          award={sampleProjectBadgeAward(plaque)}
          open
          onClose={() => setShowingProject(false)}
        />
      )}
      {showingWelcome && <WelcomePreview open onClose={() => setShowingWelcome(false)} />}
    </div>
  );
}
