import { BadgeMedal } from "@/components/badge/badge-medal";
import { BadgeReveal } from "@/components/badge/badge-reveal";
import { ProfileBadge } from "@/components/badge/profile-badge";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Page } from "@/layouts/page";
import { privatePageHead } from "@/lib/seo";
import { badgeDefinitions, type BadgeKey } from "@hubdigital/shared";
import { createFileRoute } from "@tanstack/react-router";
import { PartyPopper, RotateCcw, UserRound } from "lucide-react";
import { useState, type CSSProperties } from "react";

export const Route = createFileRoute("/playground/badges")({
  head: () => privatePageHead("Playground de distintivos"),
  component: BadgePlayground,
});

const ranges: Partial<Record<BadgeKey, string>> = {
  founder: "Atribuído pela equipa",
  maintainer: "Atribuído pela equipa",
  "founding-gold": "Membros #2–10",
  "founding-silver": "Membros #11–50",
  "founding-basalt": "Membros #51–100",
};

function BadgePlayground() {
  const [run, setRun] = useState(0);
  const [revealing, setRevealing] = useState<BadgeKey | null>(null);

  return (
    <Page header={<Header />}>
      <div className="mx-auto max-w-6xl space-y-10 py-3 sm:py-8">
        <header className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Distintivos
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              O catálogo completo, com a animação de entrada. Os distintivos de
              fundador são automáticos; o Fundador e o Maintainer são atribuídos
              no admin.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setRun((value) => value + 1)}>
            <RotateCcw />
            Reproduzir animação
          </Button>
        </header>

        <section
          aria-label="Catálogo de distintivos"
          className="overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_48%)]"
        >
          <div key={run} className="grid sm:grid-cols-2 lg:grid-cols-5">
            {badgeDefinitions.map((badge, index) => (
              <article
                key={badge.key}
                className="badge-hover badge-intro flex min-h-80 flex-col items-center justify-between border-b p-6 text-center [perspective:700px] last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0"
                style={{ "--badge-intro-delay": `${index * 140}ms` } as CSSProperties}
              >
                <div className="flex min-h-40 items-center justify-center">
                  <BadgeMedal badgeKey={badge.key} className="size-36" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{badge.name}</h2>
                  <p className="text-sm text-muted-foreground">{badge.material}</p>
                  <p className="mt-1 text-sm font-medium text-primary">{ranges[badge.key]}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setRevealing(badge.key)}
                  >
                    <PartyPopper />
                    Ver revelação
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="profile-scale-title" className="border-t pt-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center">
            <div>
              <h2 id="profile-scale-title" className="text-lg font-semibold">
                Escala real
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                A versão compacta junto ao avatar e ao nome nos comentários, sem
                estrelas, louros nem grafo de commits.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 rounded-xl border bg-card px-5 py-7 sm:grid-cols-5">
              {badgeDefinitions.map((badge) => (
                <div key={badge.key} className="flex flex-col items-center gap-3">
                  <span className="relative size-16">
                    <span className="flex size-full items-center justify-center rounded-full border bg-muted text-muted-foreground">
                      <UserRound className="size-6" />
                    </span>
                    <ProfileBadge
                      badgeKey={badge.key}
                      membershipNumber={7}
                      className="absolute -right-2 -bottom-2"
                    />
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    Ana
                    <ProfileBadge badgeKey={badge.key} className="size-5" tooltip={false} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Dialog
        open={revealing !== null}
        onClose={() => setRevealing(null)}
        title="Novo distintivo"
        hideHeader
        className="md:max-w-sm"
      >
        {revealing && (
          <div className="pt-4">
            <BadgeReveal badgeKey={revealing} membershipNumber={7} delayMs={250} />
            <Button type="button" className="mt-6 w-full" onClick={() => setRevealing(null)}>
              Continuar
            </Button>
          </div>
        )}
      </Dialog>
    </Page>
  );
}
