import { SiteFooter } from "@/components/site-footer/site-footer";
import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import type { ReactNode } from "react";

export const LEGAL_VERSION = "15 de novembro de 2026";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentProps = {
  title: string;
  summary?: string;
  updatedAt?: string;
  sections: LegalSection[];
};

export function LegalDocument({
  title,
  summary,
  updatedAt = LEGAL_VERSION,
  sections,
}: LegalDocumentProps) {
  return (
    <Page header={<Header />} footer={<SiteFooter />}>
      <article className="mx-auto max-w-5xl pb-12">
        <header className="border-b pb-8 md:pb-10">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          {summary && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              {summary}
            </p>
          )}
          <dl className="mt-6 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Última atualização</dt>
              <dd className="font-medium">{updatedAt}</dd>
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
