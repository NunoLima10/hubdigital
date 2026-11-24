import { API } from "@/api/api";
import { BadgeMedal } from "@/components/badge/badge-medal";
import { Header } from "@/components/header/header";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "@/layouts/page";
import { PersonAvatar } from "@/modules/invitations/components/person-avatar";
import type { BadgeKey } from "@hubdigital/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Github, Heart, Plus } from "lucide-react";
import type { ReactNode } from "react";

const CONTACT_EMAIL = "codeisland1460@gmail.com";
const REPO_URL = "https://github.com/NunoLima10/hubdigital";
const SPONSOR_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Patrocínio do Hub Digital")}`;

type TeamMember = {
  handle: string;
  name: string;
  image: string | null;
  bio: string;
  githubUrl: string | null;
};

function useTeam() {
  return useQuery({
    queryKey: ["maker", "team"],
    queryFn: async () =>
      (await API.get<{ data: { founders: TeamMember[]; maintainers: TeamMember[] } }>("/makers/team"))
        .data.data,
    staleTime: 5 * 60 * 1000,
  });
}

function SectionHeading({ id, children }: Readonly<{ id: string; children: ReactNode }>) {
  return (
    <div className="mb-8">
      <h2 id={id} className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

/* ── Patrocinadores ─────────────────────────────────────────────────────── */

function Sponsors() {
  return (
    <section aria-labelledby="sponsors-title" className="py-14">
      <SectionHeading id="sponsors-title">
        Quem apoia o Hub Digital
      </SectionHeading>

      <div className="grid items-center gap-x-16 gap-y-10 sm:grid-cols-2">
        <a
          href="https://ola.cv/"
          target="_blank"
          rel="noopener"
          className="group flex flex-col gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* invert + hue-rotate keeps the blue and turns the black type white in dark mode. */}
          <img
            src="/partners/cv-domains.png"
            alt="Ola.cv"
            className="h-16 w-auto self-start transition-transform group-hover:scale-[1.02] motion-reduce:transition-none sm:h-20 dark:[filter:invert(1)_hue-rotate(180deg)]"
          />
          <span className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
            Parceiro de lançamento · domínio hubdigital.cv
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </span>
        </a>

        <a
          href={SPONSOR_MAILTO}
          className="group flex flex-col gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:border-l sm:pl-10"
        >
          <span className="flex items-center gap-2 text-xl font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
            <Plus className="size-5 text-primary" aria-hidden="true" />
            O teu logótipo aqui
          </span>
          <span className="text-sm text-muted-foreground">
            Empresas e instituições que queiram apoiar a tecnologia cabo-verdiana.
          </span>
        </a>
      </div>
    </section>
  );
}

/* ── Equipa ─────────────────────────────────────────────────────────────── */

function Person({ member, size = "md" }: Readonly<{ member: TeamMember; size?: "lg" | "md" }>) {
  const large = size === "lg";
  return (
    <li className="flex items-start gap-4">
      <PersonAvatar
        name={member.name}
        image={member.image}
        className={large ? "size-16 text-lg" : "size-12 text-sm"}
      />
      <div className="min-w-0 flex-1">
        <Link
          to="/profiles/$handle"
          params={{ handle: member.handle }}
          className={`font-semibold hover:text-primary hover:underline underline-offset-4 ${large ? "text-lg" : ""}`}
        >
          {member.name}
        </Link>
        <p className="text-sm text-muted-foreground">@{member.handle}</p>
        {member.bio && (
          <p className={`mt-2 text-sm leading-6 text-foreground/80 ${large ? "max-w-xl" : "line-clamp-2"}`}>
            {member.bio}
          </p>
        )}
        <div className="mt-2 flex gap-4 text-sm">
          <Link
            to="/profiles/$handle"
            params={{ handle: member.handle }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver perfil
          </Link>
          {member.githubUrl && (
            <a
              href={member.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Github className="size-3.5" aria-hidden="true" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function TeamGroup({
  badge,
  title,
  description,
  members,
  size,
}: Readonly<{ badge: BadgeKey; title: string; description: string; members: TeamMember[]; size?: "lg" | "md" }>) {
  if (!members.length) return null;
  return (
    <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10">
      <div className="flex items-center gap-3 md:flex-col md:items-start">
        <BadgeMedal badgeKey={badge} compact className="size-12" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className={size === "lg" ? "space-y-6" : "grid gap-x-10 gap-y-7 sm:grid-cols-2"}>
        {members.map((member) => (
          <Person key={member.handle} member={member} size={size} />
        ))}
      </ul>
    </div>
  );
}

function Team() {
  const { data, isPending, isError } = useTeam();
  if (isError) return null;

  return (
    <section aria-labelledby="team-title" className="border-t py-14">
      <SectionHeading id="team-title">
        Quem faz o Hub
      </SectionHeading>
      {isPending ? (
        <div className="flex items-center gap-4" role="status" aria-label="A carregar equipa">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <TeamGroup
            badge="founder"
            title="Fundador"
            description="Criou o Hub Digital."
            members={data.founders}
            size="lg"
          />
          <TeamGroup
            badge="maintainer"
            title="Maintainers"
            description="Mantêm o código aberto do projeto."
            members={data.maintainers}
          />
          <p className="text-sm text-muted-foreground">
            Queres juntar-te?{" "}
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
              O código está no GitHub
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
}

/* ── Apoiar ─────────────────────────────────────────────────────────────── */

const costs = [
  ["Infraestrutura", "servidores, base de dados, imagens e cópias de segurança"],
  ["Deploy", "publicação, certificados, e-mail e monitorização"],
  ["Manutenção", "tempo para corrigir, rever contribuições e lançar novidades"],
] as const;

function Support() {
  return (
    <section aria-labelledby="support-title" className="border-t py-14">
      <SectionHeading id="support-title">
        Patrocinar é opcional
      </SectionHeading>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4 leading-7 text-foreground/90">
          <p>
            O Hub Digital é gratuito e continua aberto a todos. Se quiseres ajudar, o dinheiro
            vai só para o manter no ar.
          </p>
          <p>Os patrocinadores aparecem nesta página, com o seu acordo.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={SPONSOR_MAILTO}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Heart className="size-4" aria-hidden="true" />
              Quero patrocinar
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Github className="size-4" aria-hidden="true" />
              Contribuir com código
            </a>
          </div>
        </div>
        <dl className="divide-y">
          {costs.map(([title, text]) => (
            <div key={title} className="py-3 first:pt-0">
              <dt className="font-medium">{title}</dt>
              <dd className="text-sm text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ── Parceria e sorteio ─────────────────────────────────────────────────── */

const raffleSteps = [
  ["Cria a tua conta", "Cada pessoa participa uma vez, com uma conta."],
  ["Chegamos aos 100 membros", "O sorteio fica aberto até lá. O progresso está na página inicial."],
  ["Fazemos o sorteio", "5 vencedores entre os primeiros 100, de acordo com as regras abaixo."],
  ["Anunciamos aqui", "Contactamos cada vencedor pelo e-mail da conta para escolher e registar o seu domínio .cv com a Ola.cv."],
] as const;

const raffleRules = [
  {
    title: "O prémio",
    text: "Cada vencedor recebe um domínio .cv grátis durante o primeiro ano. O domínio escolhido está sujeito à disponibilidade e aos critérios de avaliação da equipa da Ola.cv.",
  },
  {
    title: "Depois do primeiro ano",
    text: "Só o primeiro ano é oferecido. A partir do segundo ano, os custos de renovação ficam a cargo do vencedor, ao preço desse domínio em específico.",
  },
  {
    title: "Uma pessoa, uma participação",
    text: "Cada pessoa participa uma única vez, com uma única conta, e só pode ganhar um domínio.",
  },
  {
    title: "Contas criadas só para participar",
    text: "Quem criar mais de uma conta para aumentar as hipóteses perde o direito a participar. Se a organização o descobrir ou se for denunciado, essas contas podem também ser despromovidas na plataforma.",
  },
  {
    title: "Declaração do vencedor",
    text: "Antes de receber o domínio, cada vencedor declara que nenhuma das outras contas participantes lhe pertence. Se a declaração for falsa, fica automaticamente desclassificado e o prémio volta a ser sorteado.",
  },
  {
    title: "Contas válidas",
    text: "Contam apenas contas reais e ativas. Contas falsas ou suspensas à data do sorteio ficam de fora.",
  },
] as const;

function RaffleRules() {
  return (
    <div className="mt-12">
      <h4 className="font-semibold">Regras do sorteio</h4>
      <ol className="mt-4 divide-y border-y">
        {raffleRules.map((rule, i) => (
          <li key={rule.title} className="grid gap-1 py-4 sm:grid-cols-[2rem_14rem_minmax(0,1fr)] sm:gap-4">
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="font-medium">{rule.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{rule.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        Dúvidas ou sabes de alguém com várias contas? Escreve para{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Sorteio .cv")}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}

function Partnership() {
  return (
    <section aria-labelledby="partner-title" className="border-t py-14">
      <SectionHeading id="partner-title">
        Hub Digital × Ola.cv
      </SectionHeading>
      <div className="max-w-2xl space-y-4 leading-7 text-foreground/90">
        <p>
          A{" "}
          <a href="https://ola.cv/" target="_blank" rel="noopener" className="font-medium text-primary underline-offset-4 hover:underline">
            Ola.cv
          </a>{" "}
          oferece o domínio <strong>hubdigital.cv</strong>, por isso o projeto não paga nada por ele.
        </p>
      </div>

      <div id="sorteio" className="mt-12 scroll-mt-6">
        <h3 className="text-xl font-semibold tracking-tight">Sorteio de 5 domínios .cv</h3>
        <p className="mt-2 max-w-2xl leading-7 text-foreground/90">
          No lançamento, a Ola.cv oferece <strong>5 domínios .cv</strong>, grátis durante o primeiro ano, para sortear
          entre os <strong>primeiros 100 membros</strong>.
        </p>

        <ol className="mt-8 space-y-0">
          {raffleSteps.map(([title, text], i) => (
            <li key={title} className="relative flex gap-5 pb-8 last:pb-0">
              {/* The connecting line, hidden after the last step. */}
              {i < raffleSteps.length - 1 && (
                <span aria-hidden="true" className="absolute top-8 bottom-0 left-[0.9375rem] w-px bg-border" />
              )}
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="pt-1">
                <p className="font-medium">{title}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <RaffleRules />
      </div>
    </section>
  );
}

export function SponsorsPage() {
  return (
    <Page header={<Header />} footer={<SiteFooter />}>
      <article className="mx-auto max-w-4xl pb-8">
        <header className="pb-6 pt-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Patrocínios</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            O Hub Digital é gratuito, de código aberto e feito em Cabo Verde. Estas são as
            pessoas e os parceiros que o mantêm no ar.
          </p>
        </header>
        <Sponsors />
        <Team />
        <Support />
        <Partnership />
      </article>
    </Page>
  );
}
