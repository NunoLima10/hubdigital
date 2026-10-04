import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rankings/$week")({
  component: RankingPage,
});
function RankingPage() {
  const { week } = Route.useParams();
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  return (
    <Page header={<Header />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {match ? `Semana ${Number(match[2])} de ${match[1]}` : week}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O ranking desta semana já está fechado. Vê o que a comunidade lançou
            e votou.
          </p>
          <Link
            to="/"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Ver os lançamentos desta semana
          </Link>
        </div>
        <ProjectList week={week} />
      </div>
    </Page>
  );
}
