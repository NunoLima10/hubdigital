import {
  ProjectEmbedBanner,
  type EmbedBannerKind,
} from "@/components/project-badge/project-embed-banner";
import {
  ProjectPlaque,
  type PlaqueRibbonStyle,
  type ProjectPlaqueKind,
} from "@/components/project-badge/project-plaque";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, RotateCcw, X } from "lucide-react";
import { useState, type CSSProperties } from "react";

type Chip = "auto" | "manual" | "repeat";

type PlaqueEntry = {
  kind: ProjectPlaqueKind;
  name: string;
  rule: string;
  chips: Chip[];
  period?: string;
  rank?: number;
  number?: number;
};

const groups: { title: string; entries: PlaqueEntry[] }[] = [
  {
    title: "Ranking semanal · o material diz o nível, o número diz a posição",
    entries: [
      { kind: "weekly-top-1", name: "1º da semana", rule: "Primeiro lugar no fecho da semana. Ouro maciço e um 1º grande; a coroa só cai sobre o número ao passar o rato ou tocar.", chips: ["auto", "repeat"], period: "2026-W46" },
      { kind: "weekly-top-3", name: "Top 3 da semana", rule: "2º ou 3º lugar. O número mostra a posição exata.", chips: ["auto", "repeat"], period: "2026-W44", rank: 2 },
      { kind: "weekly-top-10", name: "Top 10 da semana", rule: "Do 4º ao 10º lugar no fecho da semana.", chips: ["auto", "repeat"], period: "2026-W41", rank: 7 },
    ],
  },
  {
    title: "Apoios · marcos acumulados, ganhos uma vez",
    entries: [
      { kind: "upvotes-10", name: "10 apoios", rule: "Os primeiros apoios da comunidade.", chips: ["auto"] },
      { kind: "upvotes-50", name: "50 apoios", rule: "Esmalte cobalto, a cor de destaque da marca.", chips: ["auto"] },
      { kind: "upvotes-100", name: "100 apoios", rule: "Cobalto profundo com moldura dourada.", chips: ["auto"] },
      { kind: "upvotes-500", name: "500 apoios", rule: "Holográfica, com aura animada. O marco mais raro.", chips: ["auto"] },
    ],
  },
  {
    title: "Distinções",
    entries: [
      { kind: "staff-pick", name: "Escolha da equipa", rule: "Destaque editorial da equipa do Hub Digital.", chips: ["manual"] },
      { kind: "project-of-month", name: "Projeto do mês", rule: "O número do mês no centro da bandeira de Cabo Verde: anel de dez estrelas sobre as riscas. Ao passar o rato, as estrelas correm à volta do número.", chips: ["manual", "repeat"], period: "2026-11" },
      { kind: "pioneer", name: "Pioneiro", rule: "Um dos primeiros 50 projetos lançados no Hub.", chips: ["auto"], number: 12 },
    ],
  },
];

const chipStyles: Record<Chip, [string, string]> = {
  auto: ["Automático", "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"],
  manual: ["Manual", "bg-amber-500/14 text-amber-700 dark:text-amber-300"],
  repeat: ["Repetível", "bg-primary-soft text-primary"],
};

const anatomy = [
  ["Forma", "Quadrado com cantos a 22%, como o ícone da app. As medalhas redondas ficam para as pessoas."],
  ["Selo H", "O símbolo do Hub, em tinta, carimbado no topo de todas as placas."],
  ["Fita", "Leva o período em que a placa foi ganha. Há três versões em comparação no seletor acima."],
  ["Bandeira", "Riscas branca, vermelha e branca e anel de dez estrelas. Só no projeto do mês, sempre juntos e na posição da bandeira, para nunca parecer outra bandeira."],
];

const ribbonOptions: { value: PlaqueRibbonStyle; label: string; hint: string }[] = [
  { value: "flag", label: "Bandeira", hint: "Azul com riscas branca, vermelha e branca em todas as placas." },
  { value: "white", label: "Branca", hint: "Papel e tinta, como a marca. O símbolo e o material dão a cor." },
  { value: "material", label: "Cor do material", hint: "A primeira proposta: cada placa com a fita que combina com o seu esmalte." },
];

function RibbonPicker({ value, onChange }: { value: PlaqueRibbonStyle; onChange: (value: PlaqueRibbonStyle) => void }) {
  return (
    <div role="radiogroup" aria-label="Versão da fita" className="inline-flex rounded-lg border bg-background p-0.5">
      {ribbonOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === option.value && "bg-foreground text-background hover:text-background",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProjectPlaqueShowcase() {
  const [run, setRun] = useState(0);
  const [ribbon, setRibbon] = useState<PlaqueRibbonStyle>("flag");
  let index = 0;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_55%)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm font-medium">Fita</span>
            <RibbonPicker value={ribbon} onChange={setRibbon} />
            <p className="text-sm text-muted-foreground">{ribbonOptions.find((option) => option.value === ribbon)?.hint}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setRun((value) => value + 1)}>
            <RotateCcw />
            Reproduzir entrada
          </Button>
        </div>
        <div key={run} className="space-y-2 p-4 sm:p-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mt-4 mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0">
                {group.title}
              </p>
              <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
                {group.entries.map((entry) => (
                  <li
                    key={entry.kind}
                    className="plaque-intro flex flex-col items-center gap-1 rounded-xl border bg-card px-4 pt-6 pb-4 text-center"
                    style={{ "--plaque-intro-delay": `${index++ * 90}ms` } as CSSProperties}
                  >
                    <ProjectPlaque
                      kind={entry.kind}
                      period={entry.period}
                      rank={entry.rank}
                      number={entry.number}
                      ribbon={ribbon}
                    />
                    <h3 className="mt-3 font-semibold">{entry.name}</h3>
                    <p className="text-sm text-muted-foreground">{entry.rule}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {entry.chips.map((chip) => (
                        <span key={chip} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", chipStyles[chip][1])}>
                          {chipStyles[chip][0]}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="divide-y border-y">
          {anatomy.map(([term, text]) => (
            <div key={term} className="grid grid-cols-[7rem_1fr] gap-4 py-3.5">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-sm leading-6 text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
        <ProjectSidebarPreview ribbon={ribbon} />
      </div>
    </div>
  );
}

/** How the plaques sit on a project page: best place first, repeats stacked. */
function ProjectSidebarPreview({ ribbon }: { ribbon: PlaqueRibbonStyle }) {
  const items: { kind: ProjectPlaqueKind; label: string; period?: string; rank?: number; times?: number }[] = [
    { kind: "weekly-top-1", label: "1º da semana", period: "2026-W46", times: 3 },
    { kind: "staff-pick", label: "Escolha da equipa" },
    { kind: "upvotes-100", label: "100 apoios" },
    { kind: "weekly-top-3", label: "Top 3 da semana", period: "2026-W44", rank: 2 },
    { kind: "pioneer", label: "Pioneiro" },
    { kind: "upvotes-50", label: "50 apoios" },
  ];
  return (
    <aside className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Conquistas</h3>
        <span className="rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground">Exemplo</span>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary-soft p-3">
        <span className="text-3xl leading-none font-semibold text-primary tabular-nums">1º</span>
        <p className="text-xs text-muted-foreground">
          <b className="block text-sm font-semibold text-foreground">Melhor posição</b>
          Semana 46 de 2026 · 3 vezes em 1º
        </p>
      </div>
      <ul className="mt-5 grid grid-cols-3 justify-items-center gap-x-3 gap-y-5">
        {items.map((item) => (
          <li key={item.kind} className="grid justify-items-center gap-1.5 text-center">
            <span className="relative">
              {item.times && (
                <>
                  <span aria-hidden="true" className="absolute inset-[6%] translate-x-2 -translate-y-2 rotate-6 rounded-[22%] bg-gradient-to-br from-[#FFE9A0] to-[#C88A14] opacity-50" />
                  <span aria-hidden="true" className="absolute inset-[6%] translate-x-3.5 -translate-y-3.5 rotate-12 rounded-[22%] bg-gradient-to-br from-[#FFE9A0] to-[#C88A14] opacity-25" />
                </>
              )}
              <ProjectPlaque
                kind={item.kind}
                period={item.period}
                rank={item.rank}
                ribbon={ribbon}
                className="relative size-[4.5rem]"
              />
              {item.times && (
                <span className="absolute -top-3 -right-3 rounded-full bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background tabular-nums">
                  ×{item.times}
                </span>
              )}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

const bannerSamples: { kind: EmbedBannerKind; name: string; period?: string; rank?: number; count?: number }[] = [
  { kind: "featured", name: "Publicado" },
  { kind: "upvotes", name: "Apoios ao vivo", count: 128 },
  { kind: "weekly-top-1", name: "1º da semana", period: "2026-W46" },
  { kind: "weekly-top-3", name: "Top 3", period: "2026-W44", rank: 2 },
  { kind: "weekly-top-10", name: "Top 10", period: "2026-W41", rank: 7 },
  { kind: "staff-pick", name: "Escolha da equipa" },
  { kind: "project-of-month", name: "Projeto do mês", period: "2026-11" },
];

const EMBED_SNIPPET = `<a href="https://hubdigital.cv/projects/morabeza-maps" target="_blank" rel="noopener">
  <img src="https://hubdigital.cv/embed/morabeza-maps.svg?type=upvotes&theme=light"
       alt="Apoie a Morabeza Maps no Hub Digital" width="250" height="54" />
</a>`;

export function EmbedBannerShowcase() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(EMBED_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {(["light", "dark"] as const).map((theme) => (
          <div
            key={theme}
            className={cn(
              "rounded-xl border p-5",
              theme === "light" ? "border-black/10 bg-white text-[#0a0a0a]" : "border-white/10 bg-[#0a0a0a] text-white",
            )}
          >
            <p className="mb-4 text-xs font-medium opacity-60">{theme === "light" ? "Tema claro" : "Tema escuro"}</p>
            <ul className="grid gap-4">
              {bannerSamples.map((sample) => (
                <li key={sample.kind} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <ProjectEmbedBanner
                    kind={sample.kind}
                    theme={theme}
                    period={sample.period}
                    rank={sample.rank}
                    count={sample.count}
                    className="h-auto w-[250px] max-w-full transition-transform hover:-translate-y-0.5"
                  />
                  <span className="text-xs opacity-60">{sample.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <p className="text-sm font-medium">Código para o site do projeto</p>
            <Button type="button" variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <pre className="overflow-x-auto bg-muted/40 p-4 text-xs leading-5">
            <code className="font-mono">{EMBED_SNIPPET}</code>
          </pre>
          <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
            Proposta de endereço. O maker copia o código na página do projeto, com o banner já escolhido.
          </p>
        </div>
        <ul className="space-y-2.5 text-sm">
          {[
            [true, "Ligar sempre à página do projeto no Hub Digital."],
            [true, "Usar 250 × 54 px. Nunca abaixo de 200 px de largura."],
            [true, "Escolher o tema conforme o fundo do site."],
            [false, "Recolorir, cortar a bandeira ou trocar a letra."],
            [false, "Mostrar uma conquista que o projeto não ganhou. Os banners de prémio só existem para quem tem a placa."],
          ].map(([ok, text]) => (
            <li key={String(text)} className="flex items-start gap-2">
              {ok ? (
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <span className={ok ? undefined : "text-muted-foreground"}>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
