import { BadgeMedal } from "@/components/badge/badge-medal";
import { BadgeReveal } from "@/components/badge/badge-reveal";
import { ProfileBadge } from "@/components/badge/profile-badge";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { FavoriteHeart, type FavoriteHeartHandle } from "@/components/favorite-heart/favorite-heart";
import { ProjectVoteButton } from "@/components/project-summary/project-summary";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { SparkBurst, type SparkBurstHandle } from "@/components/spark-burst/spark-burst";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { badgeDefinitions, type BadgeKey } from "@hubdigital/shared";
import { Minus, PartyPopper, Plus, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";

function DemoCard({
  title,
  hint,
  spec,
  children,
}: {
  title: string;
  hint: string;
  spec: string;
  children: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      <div className="grid min-h-40 place-items-center border-b bg-muted/40 p-6">{children}</div>
      <div className="space-y-1 p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{hint}</p>
        <p className="pt-1 font-mono text-xs text-muted-foreground">{spec}</p>
      </div>
    </article>
  );
}

function VoteDemo() {
  const [voted, setVoted] = useState(false);
  return (
    <ProjectVoteButton
      title="Projeto de exemplo"
      count={voted ? 43 : 42}
      active={voted}
      onClick={() => setVoted((value) => !value)}
    />
  );
}

function FavoriteDemo() {
  const [saved, setSaved] = useState(false);
  const heart = useRef<FavoriteHeartHandle>(null);
  return (
    <Button
      type="button"
      variant="outline"
      className="size-12 [&_svg]:size-5"
      aria-pressed={saved}
      aria-label={saved ? "Remover dos favoritos" : "Guardar nos favoritos"}
      onClick={() => {
        heart.current?.arm();
        setSaved((value) => !value);
      }}
    >
      <FavoriteHeart ref={heart} active={saved} />
    </Button>
  );
}

function CounterDemo() {
  const [count, setCount] = useState(128);
  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="icon" aria-label="Diminuir" onClick={() => setCount((value) => value - 1)}>
        <Minus />
      </Button>
      <RollingNumber value={count} className="h-9 min-w-16 text-center text-3xl leading-9 font-semibold tabular-nums" />
      <Button type="button" variant="outline" size="icon" aria-label="Aumentar" onClick={() => setCount((value) => value + 1)}>
        <Plus />
      </Button>
    </div>
  );
}

function SparkDemo() {
  const sparks = useRef<SparkBurstHandle>(null);
  return (
    <Button
      type="button"
      variant="outline"
      className="relative overflow-visible"
      onClick={() => sparks.current?.burst()}
    >
      <Sparkles />
      Lançar faíscas
      <SparkBurst ref={sparks} count={10} distance={34} className="text-primary" />
    </Button>
  );
}

export function MicroInteractions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DemoCard
        title="O H que salta"
        hint="Passe o rato no logótipo: os traços separam-se, o do meio sobe e saem faíscas."
        spec="500ms · cubic-bezier(0.3, 1.5, 0.5, 1)"
      >
        <BrandLogo className="cursor-default text-2xl [&_svg]:size-9" />
      </DemoCard>
      <DemoCard
        title="Votar"
        hint="A seta salta, faíscas em cobalto e o número rola para cima."
        spec="500ms · cubic-bezier(0.3, 1.6, 0.5, 1)"
      >
        <VoteDemo />
      </DemoCard>
      <DemoCard
        title="Guardar"
        hint="O coração encolhe, estoura e enche-se de vermelho. Desligar é só um toque."
        spec="pop 450ms · press 200ms · ease-out"
      >
        <FavoriteDemo />
      </DemoCard>
      <DemoCard
        title="Número rolante"
        hint="Sobe quando cresce, desce quando diminui. Ao carregar a página, não anima."
        spec="350ms · cubic-bezier(0.3, 1.4, 0.5, 1)"
      >
        <CounterDemo />
      </DemoCard>
      <DemoCard
        title="Faíscas"
        hint="Anel de pontos na cor atual. Usado no voto, no favorito e no logótipo."
        spec="500ms · cubic-bezier(0.2, 0.7, 0.3, 1)"
      >
        <SparkDemo />
      </DemoCard>
      <DemoCard
        title="Transição de página"
        hint="O conteúdo entra 6px de baixo; cabeçalho e navegação ficam quietos."
        spec="saída 160ms · entrada 220ms · ease-out"
      >
        <div className="w-full max-w-48 space-y-2" aria-hidden="true">
          <div className="h-3 w-2/3 rounded bg-foreground/80 motion-safe:animate-[hub-content-in_1.6s_ease-out_infinite]" />
          <div className="h-2 rounded bg-foreground/20 motion-safe:animate-[hub-content-in_1.6s_ease-out_80ms_infinite]" />
          <div className="h-2 w-5/6 rounded bg-foreground/20 motion-safe:animate-[hub-content-in_1.6s_ease-out_160ms_infinite]" />
        </div>
      </DemoCard>
    </div>
  );
}

const ranges: Partial<Record<BadgeKey, string>> = {
  founder: "Atribuído pela equipa",
  maintainer: "Atribuído pela equipa",
  "founding-gold": "Membros #2–10",
  "founding-silver": "Membros #11–50",
  "founding-basalt": "Membros #51–100",
};

export function BadgeShowcase() {
  const [run, setRun] = useState(0);
  const [revealing, setRevealing] = useState<BadgeKey | null>(null);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_48%)]">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <p className="text-sm text-muted-foreground">Cinco materiais, um por conquista.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setRun((value) => value + 1)}>
            <RotateCcw />
            Reproduzir entrada
          </Button>
        </div>
        <div key={run} className="grid grid-cols-2 lg:grid-cols-5">
          {badgeDefinitions.map((badge, index) => (
            <article
              key={badge.key}
              className="badge-hover badge-intro flex flex-col items-center justify-between gap-4 border-b p-5 text-center [perspective:700px] odd:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
              style={{ "--badge-intro-delay": `${index * 140}ms` } as CSSProperties}
            >
              <BadgeMedal badgeKey={badge.key} className="size-28 sm:size-32" />
              <div>
                <h3 className="font-semibold">{badge.name}</h3>
                <p className="text-sm text-muted-foreground">{badge.material}</p>
                <p className="mt-1 text-xs font-medium text-primary">{ranges[badge.key]}</p>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setRevealing(badge.key)}>
                  <PartyPopper />
                  Revelação
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center">
        <div>
          <h3 className="font-semibold">Escala real</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Junto ao avatar e ao nome a medalha perde estrelas, louros e o grafo de commits: só
            fica a forma e o material.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 rounded-xl border bg-card px-5 py-7 sm:grid-cols-5">
          {badgeDefinitions.map((badge) => (
            <div key={badge.key} className="flex flex-col items-center gap-3">
              <span className="relative size-14">
                <span className="flex size-full items-center justify-center rounded-full border bg-muted text-muted-foreground">
                  <UserRound className="size-6" />
                </span>
                <ProfileBadge badgeKey={badge.key} membershipNumber={7} className="absolute -right-2 -bottom-2" />
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                Ana
                <ProfileBadge badgeKey={badge.key} className="size-5" tooltip={false} />
              </span>
            </div>
          ))}
        </div>
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
    </div>
  );
}
