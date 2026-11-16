import { Header } from "@/components/header/header";
import { IslandIcon } from "@/components/island-icon/island-icon";
import { LogoMark } from "@/components/brand-logo/brand-logo";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Page } from "@/layouts/page";
import { cn } from "@/lib/utils";
import { islandLabels, islandValues } from "@hubdigital/shared";
import { Check, Download, ExternalLink, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  AppIcon,
  ClearSpace,
  HorizontalLockup,
  MarkAnatomy,
  StackedLockup,
} from "./brand-assets";
import { CelebrationShowcase } from "./brand-celebrations";
import { BadgeShowcase, MicroInteractions } from "./brand-demos";
import { EmbedBannerShowcase, ProjectPlaqueShowcase } from "./brand-project-badges";

const REPO_URL = "https://github.com/NunoLima10/hubdigital";

const sections = [
  { id: "simbolo", title: "O símbolo" },
  { id: "logotipo", title: "Versões do logótipo" },
  { id: "espaco", title: "Espaço e tamanhos" },
  { id: "cor", title: "Cor" },
  { id: "tipografia", title: "Tipografia e voz" },
  { id: "ilhas", title: "As ilhas" },
  { id: "distintivos", title: "Distintivos" },
  { id: "placas", title: "Placas de projeto" },
  { id: "celebracoes", title: "Celebrações" },
  { id: "banners", title: "Banners para projetos" },
  { id: "movimento", title: "Micro-interações" },
  { id: "assim-nao", title: "Assim não" },
  { id: "recursos", title: "Recursos" },
] as const;

type SectionId = (typeof sections)[number]["id"];

/* ---------- Shared pieces ---------- */

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase tabular-nums">{children}</p>;
}

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: SectionId;
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  const index = sections.findIndex((section) => section.id === id) + 1;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 border-b py-14 last:border-b-0 sm:py-20">
      <Eyebrow>
        {String(index).padStart(2, "0")} · {sections[index - 1].title}
      </Eyebrow>
      <h2 id={`${id}-title`} className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{lead}</p>
      <div className="mt-10">{children}</div>
    </section>
  );
}

const tileTones = {
  light: "bg-white text-[#0a0a0a] border-black/10",
  dark: "bg-[#0a0a0a] text-white border-white/10",
  cobalt: "bg-primary text-primary-foreground border-transparent",
  soft: "bg-primary-soft text-foreground border-transparent",
} as const;

function Tile({
  tone,
  caption,
  className,
  children,
}: {
  tone: keyof typeof tileTones;
  caption?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative grid min-h-52 place-items-center overflow-hidden rounded-xl border p-8", tileTones[tone], className)}>
      {children}
      {caption && <span className="absolute bottom-3 left-4 text-xs font-medium opacity-60">{caption}</span>}
    </div>
  );
}

/* ---------- Cover ---------- */

function Cover() {
  return (
    <header className="border-b pt-6 pb-14 sm:pt-10 sm:pb-20">
      <div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Manual da marca</span>
          <Badge className="border bg-background">v1.0 · 2026</Badge>
        </div>
        <div className="mt-14 sm:mt-20">
          <HorizontalLockup className="text-[clamp(2.75rem,10vw,6.5rem)] leading-none" />
        </div>
        <h1 className="mt-8 max-w-2xl text-xl leading-8 font-medium tracking-tight text-balance sm:text-2xl sm:leading-9">
          Um H feito de três traços, preto no branco, com um toque de cobalto.{" "}
          <span className="text-muted-foreground">
            Tudo o que precisa para usar a marca do Hub Digital — e, como o projeto, é aberto.
          </span>
        </h1>
        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5 text-sm">
          {[
            ["Projeto", "Código aberto"],
            ["Feito em", "Mindelo, Cabo Verde"],
            ["Tipo de letra", "Inter"],
            ["Cor de destaque", "#024BFF"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
              <dd className="mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

/* ---------- Sections ---------- */

function SymbolSection() {
  const facts = [
    ["3", "Traços", "Dois paralelogramos e um traço em Z que os liga. Juntos lêem-se como um H — de Hub."],
    ["21°", "Um só ângulo", "O traço do meio sobe 21°, e os traços de fora cortam com a mesma inclinação."],
    ["X", "Largura do traço", "Todos os traços têm a mesma largura. É a unidade X que mede o espaço à volta."],
    ["3", "Raio dos cantos", "Os cantos interiores arredondam ligeiramente; os exteriores ficam vivos."],
  ];
  return (
    <Section
      id="simbolo"
      title="Três traços, um H, uma ligação"
      lead="O símbolo é um H geométrico. O traço do meio liga os dois lados, como o Hub liga quem faz a quem usa. É desenhado em currentColor: segue sempre a cor do texto à sua volta."
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div className="grid place-items-center rounded-xl border bg-muted/40 p-8 sm:p-12">
          <MarkAnatomy />
        </div>
        <dl className="divide-y border-y">
          {facts.map(([value, label, text]) => (
            <div key={label} className="grid grid-cols-[4.5rem_1fr] gap-4 py-4">
              <dt className="text-3xl font-semibold tracking-tight text-primary tabular-nums">{value}</dt>
              <dd>
                <p className="font-semibold">{label}</p>
                <p className="text-sm leading-6 text-muted-foreground">{text}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

function LogoSection() {
  return (
    <Section
      id="logotipo"
      title="Quatro versões, uma regra de escolha"
      lead="Use a versão horizontal por defeito. A empilhada serve quando há espaço quadrado e queremos dizer de onde vimos. O símbolo sozinho fica para quando a marca já está presente."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Tile tone="light" caption="Fundo claro">
            <HorizontalLockup className="text-4xl" />
          </Tile>
          <VersionMeta name="Horizontal" use="Cabeçalho, rodapé, e-mails, partilhas. A versão principal." />
        </div>
        <div className="space-y-3">
          <Tile tone="dark" caption="Fundo escuro">
            <StackedLockup className="w-48" />
          </Tile>
          <VersionMeta name="Empilhada" use="Capas, cartazes, perfis em redes sociais. Inclui “Cabo Verde”." />
        </div>
        <div className="space-y-3">
          <Tile tone="cobalt" caption="Sobre cobalto">
            <LogoMark className="size-24" />
          </Tile>
          <VersionMeta name="Símbolo" use="Avatares, marcadores, carregamento — quando o nome já está por perto." />
        </div>
        <div className="space-y-3">
          <Tile tone="soft" caption="Ícone da app">
            <div className="flex items-end gap-5">
              <AppIcon className="w-24" />
              <AppIcon className="w-14" inverted />
              <AppIcon className="w-8" />
            </div>
          </Tile>
          <VersionMeta name="Ícone" use="Favicon, ecrã inicial, loja. Cantos a 22% do lado." />
        </div>
      </div>

      <h3 className="mt-14 text-lg font-semibold">Claro e escuro</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Só existem duas cores para o logótipo: tinta e papel. Em modo escuro inverte-se, nunca se colore.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile tone="light" className="min-h-36">
          <HorizontalLockup className="text-xl" />
        </Tile>
        <Tile tone="dark" className="min-h-36">
          <HorizontalLockup className="text-xl" />
        </Tile>
        <Tile tone="light" className="min-h-36">
          <StackedLockup className="w-28" />
        </Tile>
        <Tile tone="dark" className="min-h-36">
          <StackedLockup className="w-28" />
        </Tile>
      </div>

      <h3 className="mt-14 text-lg font-semibold">Só texto</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Em texto corrido escreve-se <strong className="text-foreground">Hub Digital</strong> — duas palavras, maiúsculas
        iniciais, sem “HUB”, “HubDigital” ou “hub.cv”. O domínio é hubdigital.cv.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-6">
          <p className="text-2xl font-semibold tracking-tight">Hub Digital</p>
          <p className="mt-2 text-xs text-muted-foreground">Inter · Semibold · −0,025em</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-2xl font-semibold tracking-tight">
            Hub Digital <span className="text-muted-foreground">Cabo Verde</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Descritor em cinzento, mesmo peso</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="font-mono text-2xl tracking-tight">hubdigital.cv</p>
          <p className="mt-2 text-xs text-muted-foreground">Domínio, sempre em minúsculas</p>
        </div>
      </div>
    </Section>
  );
}

function VersionMeta({ name, use }: { name: string; use: string }) {
  return (
    <div>
      <p className="font-semibold">{name}</p>
      <p className="text-sm text-muted-foreground">{use}</p>
    </div>
  );
}

function SpaceSection() {
  const sizes = [
    { label: "16 px", note: "Favicon", px: 16 },
    { label: "24 px", note: "Cabeçalho", px: 24 },
    { label: "40 px", note: "Cartões", px: 40 },
    { label: "64 px", note: "Destaques", px: 64 },
  ];
  return (
    <Section
      id="espaco"
      title="Medido com X"
      lead="X é a largura de um traço do H. À volta do símbolo fica sempre, pelo menos, um X livre de texto, imagens ou margens da página."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid place-items-center rounded-xl border bg-muted/40 p-8">
          <ClearSpace />
        </div>
        <div className="flex flex-col justify-between gap-8 rounded-xl border p-6">
          <div>
            <h3 className="font-semibold">Tamanhos mínimos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Abaixo de 16 px o traço do meio deixa de se ler. A versão horizontal não desce dos 20 px de altura.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-8">
            {sizes.map((size) => (
              <div key={size.label} className="grid justify-items-start gap-2">
                <span style={{ width: size.px, height: size.px }} className="grid">
                  <LogoMark className="size-full" />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <b className="block font-semibold text-foreground">{size.label}</b>
                  {size.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function ColorSection() {
  const swatches = [
    { name: "Tinta", token: "--foreground", light: "#0A0A0A", dark: "#FAFAFA", chip: "bg-foreground text-background" },
    { name: "Papel", token: "--background", light: "#FFFFFF", dark: "#0A0A0A", chip: "bg-background text-foreground border-b" },
    { name: "Cobalto", token: "--primary", light: "#024BFF", dark: "#4D7FFF", chip: "bg-primary text-primary-foreground" },
    { name: "Cobalto suave", token: "--primary-soft", light: "#ECF2FE", dark: "cobalto 16%", chip: "bg-primary-soft text-primary" },
    { name: "Névoa", token: "--muted", light: "#F5F5F5", dark: "#262626", chip: "bg-muted text-foreground" },
    { name: "Cinza", token: "--muted-foreground", light: "#737373", dark: "#A1A1A1", chip: "bg-muted-foreground text-background" },
    { name: "Linha", token: "--border", light: "#E5E5E5", dark: "branco 10%", chip: "bg-border text-foreground" },
    { name: "Alerta", token: "--destructive", light: "#E7000B", dark: "#FF6467", chip: "bg-destructive text-white" },
  ];
  return (
    <Section
      id="cor"
      title="Preto, branco e um toque de cobalto"
      lead="A interface é monocromática: os botões são tinta sobre papel. O cobalto é reservado a ligações, seleção, foco e pequenos momentos de festa — nunca a grandes superfícies."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {swatches.map((swatch) => (
          <div key={swatch.name} className="overflow-hidden rounded-xl border bg-card">
            <div className={cn("flex h-28 items-end p-3 text-lg font-semibold tracking-tight", swatch.chip)}>
              {swatch.name}
            </div>
            <div className="grid gap-0.5 p-3 text-xs">
              <code className="font-mono text-foreground">{swatch.token}</code>
              <span className="text-muted-foreground tabular-nums">Claro {swatch.light}</span>
              <span className="text-muted-foreground tabular-nums">Escuro {swatch.dark}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        As amostras usam os tokens reais de <code className="font-mono">web/src/index.css</code>: mude o tema no
        cabeçalho para ver a versão escura.
      </p>

      <h3 className="mt-14 text-lg font-semibold">Proporção</h3>
      <p className="mt-1 text-sm text-muted-foreground">Num ecrã típico, o cobalto não passa de um vigésimo.</p>
      <div className="mt-5 flex h-16 overflow-hidden rounded-xl border text-xs font-semibold">
        <div className="flex w-[65%] items-end bg-background p-2.5">Papel 65%</div>
        <div className="flex w-[18%] items-end bg-muted p-2.5">Névoa 18%</div>
        <div className="flex w-[12%] items-end bg-foreground p-2.5 text-background">Tinta 12%</div>
        <div className="flex w-[5%] items-end bg-primary p-2.5 text-primary-foreground" title="Cobalto 5%">
          <span className="sr-only">Cobalto</span>5%
        </div>
      </div>

      <h3 className="mt-14 text-lg font-semibold">Botões</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        A ação principal é tinta. O cobalto aparece no texto de uma ligação, nunca no fundo de um botão.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border p-6">
        <Button type="button">Publicar projeto</Button>
        <Button type="button" variant="outline">Guardar rascunho</Button>
        <Button type="button" variant="ghost">Cancelar</Button>
        <Button type="button" variant="link">Ver termos</Button>
        <Badge className="bg-foreground text-background">Novo</Badge>
        <Badge className="bg-primary-soft text-primary">Em destaque</Badge>
      </div>
    </Section>
  );
}

function TypeSection() {
  const scale = [
    { label: "Título de página", spec: "36 / 40 · Semibold · −0,025em", sample: "Projetos feitos em Cabo Verde", className: "text-4xl font-semibold tracking-tight" },
    { label: "Título de secção", spec: "20 / 28 · Semibold", sample: "Lançamentos desta semana", className: "text-xl font-semibold tracking-tight" },
    { label: "Corpo", spec: "16 / 28 · Regular", sample: "Descubra, partilhe e apoie projetos digitais criados por cabo-verdianos.", className: "text-base leading-7" },
    { label: "Interface", spec: "14 / 20 · Medium", sample: "Votar · Guardar · Partilhar", className: "text-sm font-medium" },
    { label: "Legenda", spec: "12 / 16 · Regular · cinza", sample: "Publicado há 3 dias em São Vicente", className: "text-xs text-muted-foreground" },
    { label: "Números", spec: "tabular-nums", sample: "1 024 votos · #07", className: "text-2xl font-semibold tabular-nums" },
  ];
  const voice = [
    ["Direto", "Diga o que acontece. “Projeto publicado”, não “O seu projeto foi publicado com sucesso!”."],
    ["Português de Cabo Verde", "Escrevemos em português europeu, com orgulho nos nomes das ilhas e das pessoas."],
    ["Aberto", "Mostramos como funciona por dentro. Sem jargão, sem promessas vazias."],
  ];
  return (
    <Section
      id="tipografia"
      title="Uma só letra: Inter"
      lead="Inter em fonte variável, de 400 a 700. Títulos em semibold com tracking ligeiramente apertado; números sempre tabulares para que contadores não dancem."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col justify-between overflow-hidden rounded-xl border p-6">
          <p className="text-[clamp(5rem,12vw,8rem)] leading-none font-semibold tracking-tighter">Aa</p>
          <div className="mt-6 space-y-1 text-sm">
            <p className="font-semibold">Inter Variable</p>
            <p className="text-muted-foreground">@fontsource-variable/inter · OFL</p>
            <p className="pt-3 font-mono text-xs break-all text-muted-foreground">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 ãçéêõ
            </p>
          </div>
        </div>
        <div className="divide-y rounded-xl border px-6">
          {scale.map((row) => (
            <div key={row.label} className="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-6">
              <div className="text-xs text-muted-foreground">
                <b className="block text-sm font-semibold text-foreground">{row.label}</b>
                {row.spec}
              </div>
              <p className={cn("min-w-0 truncate", row.className)}>{row.sample}</p>
            </div>
          ))}
        </div>
      </div>

      <h3 className="mt-14 text-lg font-semibold">Voz</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {voice.map(([title, text]) => (
          <div key={title} className="rounded-xl border p-5">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function IslandsSection() {
  return (
    <Section
      id="ilhas"
      title="Nove ilhas, um traço"
      lead="Cada ilha habitada tem o seu contorno em SVG, desenhado em currentColor como o símbolo. Aparecem nos filtros, nos perfis e no mapa."
    >
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {islandValues.map((island) => (
          <li
            key={island}
            className="flex flex-col items-center gap-3 rounded-xl border px-2 py-5 text-center transition-colors hover:border-primary hover:text-primary"
          >
            <IslandIcon island={island} className="size-12" />
            <span className="text-xs leading-tight font-medium">{islandLabels[island]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Componente <code className="font-mono">IslandIcon</code> · contornos adaptados dos ícones de onboarding do
        Notifika. Santa Luzia fica de fora por ser desabitada.
      </p>
    </Section>
  );
}

function BadgesSection() {
  return (
    <Section
      id="distintivos"
      title="Medalhas para quem chegou primeiro"
      lead="Os distintivos celebram os primeiros membros e quem mantém o projeto. Cada um tem um material — diamante, ouro, prata, basalto vulcânico — e uma entrada animada que só toca no momento da conquista."
    >
      <BadgeShowcase />
    </Section>
  );
}

function PlaquesSection() {
  return (
    <Section
      id="placas"
      title="Placas para os projetos"
      lead="As conquistas de um projeto são placas quadradas e só aparecem na página do projeto. Cada uma leva o selo H do Hub e uma fita nas cores da bandeira de Cabo Verde, com a semana ou o mês em que foi ganha."
    >
      <ProjectPlaqueShowcase />
    </Section>
  );
}

function CelebrationsSection() {
  return (
    <Section
      id="celebracoes"
      title="Momentos para celebrar"
      lead="Quando alguém ou um projeto ganha uma conquista, o Hub para um instante e faz festa: a peça ganha entra em grande e encaixa no sítio a que pertence. Toca uma só vez, por cima do site, e desliga-se com prefers-reduced-motion."
    >
      <CelebrationShowcase />
    </Section>
  );
}

function BannersSection() {
  return (
    <Section
      id="banners"
      title="Banners para levar para fora"
      lead="Os projetos podem mostrar no próprio site que estão no Hub Digital. Os banners são imagens SVG simples, em claro ou escuro, com a bandeira na ponta quando celebram uma conquista."
    >
      <EmbedBannerShowcase />
    </Section>
  );
}

function MotionSection() {
  const tokens = [
    ["Pressionar", "200ms", "ease-out", "Desligar um voto ou favorito"],
    ["Rolar", "350ms", "cubic-bezier(0.3, 1.4, 0.5, 1)", "Contadores"],
    ["Estourar", "450ms", "ease-out", "Ligar um favorito"],
    ["Saltar", "500ms", "cubic-bezier(0.3, 1.6, 0.5, 1)", "Votar, logótipo"],
    ["Deslizar", "280ms", "cubic-bezier(0.22, 1, 0.36, 1)", "Transições partilhadas, passos"],
    ["Aterrar", "950ms", "cubic-bezier(0.2, 1.3, 0.4, 1)", "Entrada de um distintivo"],
  ];
  return (
    <Section
      id="movimento"
      title="Pequenas festas"
      lead="O movimento recompensa uma ação, nunca a atrasa. As animações só tocam depois de um clique (estado que chega do servidor aparece sem animar) e desligam-se com prefers-reduced-motion."
    >
      <MicroInteractions />

      <h3 className="mt-14 text-lg font-semibold">Tokens de movimento</h3>
      <div className="mt-5 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs tracking-wide text-muted-foreground uppercase">
            <tr className="border-b">
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">Duração</th>
              <th className="px-4 py-3 font-semibold">Curva</th>
              <th className="px-4 py-3 font-semibold">Onde</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tokens.map(([name, duration, easing, where]) => (
              <tr key={name}>
                <td className="px-4 py-3 font-medium">{name}</td>
                <td className="px-4 py-3 tabular-nums">{duration}</td>
                <td className="px-4 py-3 font-mono text-xs">{easing}</td>
                <td className="px-4 py-3 text-muted-foreground">{where}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function DontsSection() {
  const donts = [
    { label: "Não esticar nem achatar", node: <LogoMark className="size-16 scale-x-150" /> },
    { label: "Não rodar", node: <LogoMark className="size-16 rotate-[24deg]" /> },
    { label: "Não colorir o símbolo", node: <LogoMark className="size-16 text-primary" /> },
    {
      label: "Não usar gradientes nem sombras",
      node: (
        <span className="bg-gradient-to-br from-fuchsia-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]">
          <LogoMark className="size-16 text-fuchsia-500" />
        </span>
      ),
    },
    { label: "Não usar sem contraste", node: <LogoMark className="size-16 text-neutral-300" />, tone: "bg-neutral-200" },
    { label: "Não usar só o contorno", node: <LogoMark className="size-16 fill-none stroke-current stroke-[3]" /> },
    {
      label: "Não separar os traços",
      node: (
        <svg viewBox="120 110 120 140" className="size-16" fill="currentColor" aria-hidden="true">
          <path transform="translate(-10 -8)" d="M133 124 L156 133 Q159 134 159 137 L159 165 Q159 167 156 168 L133 178 Z" />
          <path d="M226 124 L204 133 Q201 134 201 137 L201 157 Q201 160 198 162 L136 186 Q133 187 133 191 L133 236 L155 227 Q159 226 159 222 L159 202 Q159 199 162 198 L223 175 Q227 173 227 170 L227 124 Z" />
          <path transform="translate(10 8)" d="M227 182 L204 191 Q201 192 201 196 L201 222 Q201 225 204 227 L227 237 Z" />
        </svg>
      ),
    },
    {
      label: "Não trocar a letra do nome",
      node: (
        <span className="inline-flex items-center gap-2 font-serif text-2xl italic">
          <LogoMark className="size-7" />
          Hub Digital
        </span>
      ),
    },
  ];
  return (
    <Section
      id="assim-nao"
      title="Assim não"
      lead="O símbolo é simples de propósito: qualquer efeito acrescentado tira-lhe força. A única exceção é a animação do logótipo, em que os traços se separam por meio segundo e voltam ao lugar."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {donts.map((item) => (
          <figure key={item.label} className="overflow-hidden rounded-xl border border-destructive/30">
            <div className={cn("grid h-36 place-items-center bg-white text-[#0a0a0a]", item.tone)}>{item.node}</div>
            <figcaption className="flex items-start gap-2 p-3 text-sm">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              {item.label}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-r-xl border-l-4 border-primary bg-muted/50 px-5 py-4 text-sm">
        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Na dúvida: tinta sobre papel, papel sobre tinta, com um X de espaço à volta. É sempre a resposta certa.
        </p>
      </div>
    </Section>
  );
}

function ResourcesSection() {
  const files = [
    // The black SVGs sit on white, like the files themselves, so the preview
    // shows exactly what downloads.
    { name: "Símbolo", file: "logo-h.svg", format: "SVG · preto, fundo transparente", preview: "bg-white p-10" },
    { name: "Logótipo empilhado", file: "hub-digital-cabo-verde.svg", format: "SVG · preto, fundo transparente", preview: "bg-white p-6" },
    { name: "Ícone da app", file: "favicon.svg", format: "SVG · 512×512", preview: "bg-muted p-10" },
    { name: "Ícone iOS", file: "apple-touch-icon.png", format: "PNG · 180×180", preview: "bg-muted p-10" },
    { name: "Imagem de partilha", file: "og.png", format: "PNG · 1200×630", preview: "bg-muted p-3" },
  ];
  return (
    <Section
      id="recursos"
      title="Leve a marca consigo"
      lead="Os ficheiros originais vivem na pasta brand/ do repositório. Pode usá-los para falar do Hub Digital, apontar para um projeto publicado ou contribuir com o código."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((item) => (
          <li key={item.file} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
            <div className={cn("h-44 border-b", item.preview)}>
              <img
                src={`/${item.file}`}
                alt={`Pré-visualização de ${item.file}`}
                loading="lazy"
                className="size-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{item.file}</p>
                <p className="truncate text-xs text-muted-foreground">{item.format}</p>
              </div>
              <a
                href={`/${item.file}`}
                download
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto w-full")}
              >
                <Download />
                Descarregar
              </a>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`${REPO_URL}/tree/main/brand`} target="_blank" rel="noreferrer" className={buttonVariants()}>
          <ExternalLink />
          Pasta brand/ no GitHub
        </a>
        <a
          href={`${REPO_URL}/blob/main/web/src/index.css`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Tokens em index.css
        </a>
      </div>
    </Section>
  );
}

/* ---------- Page ---------- */

function BrandNav() {
  return (
    <nav aria-label="Secções do manual da marca" className="lg:sticky lg:top-6">
      <p className="mb-3 hidden text-sm font-semibold lg:block">Manual da marca</p>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
        {sections.map((section, index) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="flex gap-3 rounded-md border px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground lg:border-transparent lg:px-2 lg:py-1.5"
            >
              <span className="w-5 text-muted-foreground/70 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BrandPage() {
  return (
    <Page header={<Header />} footer={<SiteFooter />}>
      <Cover />
      <div className="grid gap-6 pt-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12 lg:pt-0">
        <aside className="min-w-0 lg:pt-14">
          <BrandNav />
        </aside>
        <div className="min-w-0">
          <SymbolSection />
          <LogoSection />
          <SpaceSection />
          <ColorSection />
          <TypeSection />
          <IslandsSection />
          <BadgesSection />
          <PlaquesSection />
          <CelebrationsSection />
          <BannersSection />
          <MotionSection />
          <DontsSection />
          <ResourcesSection />
        </div>
      </div>
    </Page>
  );
}
