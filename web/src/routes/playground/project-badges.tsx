import { ProjectPlaque } from "@/components/project-badge/project-plaque";
import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { privatePageHead } from "@/lib/seo";
import { ProjectBadgeCelebrationView } from "@/modules/project-badges/components/project-badge-celebration-view";
import { sampleProjectBadgeAward } from "@/modules/project-badges/sample-award";
import {
  projectBadgeCatalog,
  projectBadgeKeyValues,
  type ProjectBadgeKey,
} from "@hubdigital/shared";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/playground/project-badges")({
  head: () => privatePageHead("Playground de conquistas de projeto"),
  component: ProjectBadgePlayground,
});

/**
 * Every project achievement's celebration, to look at. Nothing here touches
 * the API: the buttons only close the overlay.
 */
function ProjectBadgePlayground() {
  const [showing, setShowing] = useState<ProjectBadgeKey | null>(null);

  return (
    <Page header={<Header />}>
      <div className="mx-auto max-w-5xl space-y-8 py-3 sm:py-8">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Conquistas de projeto
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            A celebração que o maker vê ao abrir o site depois de um projeto ganhar
            uma conquista. Aqui só se vê: os botões fecham a janela e nada é guardado.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {projectBadgeKeyValues.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setShowing(key)}
              className="flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ProjectPlaque kind={key} className="size-20" />
              <span className="text-sm font-semibold">{projectBadgeCatalog[key].name}</span>
              <span className="text-xs text-primary">Ver celebração</span>
            </button>
          ))}
        </div>
      </div>

      {showing && (
        <ProjectBadgeCelebrationView
          key={showing}
          award={sampleProjectBadgeAward(showing)}
          open
          onClose={() => setShowing(null)}
        />
      )}
    </Page>
  );
}
