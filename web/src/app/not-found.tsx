import { Header } from "@/components/header/header";
import { SiteFooter } from "@/components/site-footer/site-footer";
import { Page } from "@/layouts/page";
import { SITE_NAME } from "@/lib/seo";
import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <Page header={<Header />} footer={<SiteFooter />}>
      {/* React hoists these into <head>; a missing page must stay out of the index. */}
      <title>{`Página não encontrada | ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex" />
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl font-semibold text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O endereço que abriste não existe ou já foi removido.
        </p>
        <Link
          to="/"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/85"
        >
          Voltar ao início
        </Link>
      </div>
    </Page>
  );
}
