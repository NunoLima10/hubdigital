import { SiteFooter } from "@/components/site-footer/site-footer";
import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { AlertTriangle, FileText } from "lucide-react";
import type { ReactNode } from "react";

export const LEGAL_VERSION = "15 de novembro de 2026";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  title: string;
  summary: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, summary, sections }: LegalDocumentProps) {
  return (
    <Page header={<Header />} footer={<SiteFooter />}>
      <article className="mx-auto max-w-5xl pb-12">
        <header className="border-b pb-8 md:pb-10">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <FileText className="size-4" aria-hidden="true" />
            Documento legal
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {summary}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Versão</dt>
              <dd className="font-medium">{LEGAL_VERSION}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Estado</dt>
              <dd className="font-medium">Preparação para publicação</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
          <aside className="min-w-0">
            <nav aria-label={`Índice de ${title}`} className="lg:sticky lg:top-6">
              <p className="mb-3 text-sm font-semibold">Neste documento</p>
              <ol className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {sections.map((section) => (
                  <li key={section.id} className="shrink-0 lg:shrink">
                    <a
                      href={`#${section.id}`}
                      className="block rounded-md border px-3 py-2 text-sm text-muted-foreground hover:border-foreground/25 hover:bg-muted hover:text-foreground lg:border-transparent"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="mb-8 flex gap-3 border-l-4 border-primary bg-primary-soft p-4 text-sm leading-6">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Informação do operador ainda necessária</p>
                <p className="mt-1 text-muted-foreground">
                  Antes da publicação definitiva, devem ser inseridos o nome legal, NIF,
                  registo, morada, telefone e contactos de suporte e privacidade do responsável
                  pelo Hub Digital. O documento permanece fora dos motores de pesquisa até essa
                  informação ser confirmada.
                </p>
              </div>
            </div>

            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-6 border-b pb-10 last:border-b-0">
                  <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                  <div className="legal-copy mt-4 space-y-4 text-[0.95rem] leading-7 text-foreground/90">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Page>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-2 marker:text-primary">{children}</ul>;
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">
      {children}
    </a>
  );
}
