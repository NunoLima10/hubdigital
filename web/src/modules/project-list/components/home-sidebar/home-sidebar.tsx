import { Link } from "@tanstack/react-router";
import { ArrowRight, FolderKanban, Layers3, Rocket } from "lucide-react";
import { useCategories } from "@/modules/submit/hooks/use-categories";
import { useProjects } from "../../hooks/use-projects";

export function HomeSidebar() {
  const all = useProjects({ period: "all" });
  const weekly = useProjects({ period: "this_week" });
  const { data: categories } = useCategories();
  const stats = [
    {
      label: "Projetos publicados",
      value: all.data?.meta.total,
      icon: FolderKanban,
    },
    { label: "Esta semana", value: weekly.data?.meta.total, icon: Rocket },
    { label: "Categorias", value: categories?.length, icon: Layers3 },
  ];
  return (
    <div className="space-y-7">
      <section aria-labelledby="site-stats-title">
        <h2 id="site-stats-title" className="mb-3 text-sm font-semibold">
          HubDigital em números
        </h2>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-start gap-1 rounded-lg border bg-card px-3 py-3 lg:flex-row lg:items-center lg:gap-3 lg:px-4"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary lg:size-9">
                <Icon className="size-4" />
              </span>
              <div>
                <div className="text-lg font-semibold tabular-nums">
                  {value === undefined ? "—" : value.toLocaleString("pt-CV")}
                </div>
                <div className="text-[11px] leading-4 text-muted-foreground lg:text-xs">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="hidden rounded-lg border bg-muted/40 p-5 lg:block">
        <h2 className="font-semibold">Feito em Cabo Verde</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Descobre produtos, ferramentas e ideias criadas pela comunidade
          cabo-verdiana.
        </p>
        <Link
          to="/dashboard/submit"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Partilhar um projeto <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
