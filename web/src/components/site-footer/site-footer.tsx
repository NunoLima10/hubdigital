import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { writeAnalyticsConsent } from "@/lib/analytics-consent";
import { analyticsEnabled } from "@/lib/posthog";
import { Link } from "@tanstack/react-router";

const linkClass = "font-medium hover:text-primary hover:underline";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/25">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-sm md:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <BrandLogo className="text-base" />
            <p className="max-w-md text-muted-foreground">
              Descobrir, partilhar e apoiar projetos digitais ligados a Cabo Verde.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <nav aria-label="Explorar" className="flex flex-wrap gap-x-5 gap-y-3">
              <Link to="/" className={linkClass}>
                Projetos
              </Link>
              <Link to="/map" className={linkClass}>
                Mapa
              </Link>
              <Link to="/brand" className={linkClass}>
                Marca
              </Link>
            </nav>
            <nav aria-label="Informação legal" className="flex flex-wrap gap-x-5 gap-y-3">
              <Link to="/termos" className={linkClass}>
                Termos de utilização
              </Link>
              <Link to="/privacidade" className={linkClass}>
                Privacidade
              </Link>
              <Link to="/ranking" className={linkClass}>
                Como funciona o ranking
              </Link>
              {analyticsEnabled && (
                // Forgetting the answer brings the cookie banner back.
                <button
                  type="button"
                  className={`${linkClass} text-left`}
                  onClick={() => writeAnalyticsConsent(null)}
                >
                  Preferências de cookies
                </button>
              )}
            </nav>
          </div>
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
