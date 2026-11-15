import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/25">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 text-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-2">
          <BrandLogo className="text-base" />
          <p className="max-w-md text-muted-foreground">
            Descobrir, partilhar e apoiar projetos digitais ligados a Cabo Verde.
          </p>
        </div>
        <nav aria-label="Informação legal" className="flex flex-wrap gap-x-5 gap-y-3">
          <Link to="/termos" className="font-medium hover:text-primary hover:underline">
            Termos de utilização
          </Link>
          <Link to="/privacidade" className="font-medium hover:text-primary hover:underline">
            Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
}
