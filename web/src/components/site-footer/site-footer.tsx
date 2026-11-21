import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { writeAnalyticsConsent } from "@/lib/analytics-consent";
import { analyticsEnabled } from "@/lib/posthog";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const linkClass = "text-muted-foreground transition-colors hover:text-foreground hover:underline";

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/25">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 text-sm md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2 sm:col-span-2 md:col-span-1">
            <BrandLogo className="text-base" />
            <p className="max-w-xs text-muted-foreground">
              Descobrir, partilhar e apoiar projetos digitais ligados a Cabo Verde.
            </p>
          </div>
          <FooterGroup title="Explorar">
            <li>
              <Link to="/" className={linkClass}>
                Projetos
              </Link>
            </li>
            <li>
              <Link to="/map" className={linkClass}>
                Mapa
              </Link>
            </li>
            <li>
              <Link to="/ranking" className={linkClass}>
                Como funciona o ranking
              </Link>
            </li>
          </FooterGroup>
          <FooterGroup title="Projeto">
            <li>
              <Link to="/brand" className={linkClass}>
                Marca
              </Link>
            </li>
            <li>
              <Link to="/patrocinios" className={linkClass}>
                Patrocínios
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/NunoLima10/hubdigital"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Código-fonte (AGPL)
              </a>
            </li>
          </FooterGroup>
          <FooterGroup title="Legal">
            <li>
              <Link to="/termos" className={linkClass}>
                Termos de utilização
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className={linkClass}>
                Privacidade
              </Link>
            </li>
            {analyticsEnabled && (
              <li>
                {/* Forgetting the answer brings the cookie banner back. */}
                <button
                  type="button"
                  className={`${linkClass} text-left`}
                  onClick={() => writeAnalyticsConsent(null)}
                >
                  Preferências de cookies
                </button>
              </li>
            )}
          </FooterGroup>
        </div>
        <p className="border-t pt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hub Digital · Código aberto, feito em Mindelo, Cabo Verde,
          e mantido principalmente por{" "}
          <a
            href="https://github.com/NunoLima10"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            Nuno Lima
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
