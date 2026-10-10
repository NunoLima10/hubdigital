import { BarChart3, Heart, Rocket, UserRound } from "lucide-react";
import { NavLink } from "../nav-link/nav-link";

export function DashboardNav() {
  return (
    <nav aria-label="Dashboard" className="flex w-max gap-1 px-0.5 lg:block lg:w-auto lg:space-y-1 lg:px-0">
      <p className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Workspace
      </p>
      <NavLink
        to="/dashboard/releases"
        title="Lançamentos"
        icon={<Rocket className="size-4" />}
      />
      <NavLink
        to="/dashboard/metrics"
        title="Métricas"
        icon={<BarChart3 className="size-4" />}
      />
      <p className="hidden px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Minha conta
      </p>
      <NavLink
        to="/dashboard/profile"
        title="Perfil"
        icon={<UserRound className="size-4" />}
      />
      <NavLink
        to="/dashboard/favorites"
        title="Favoritos"
        icon={<Heart className="size-4" />}
      />
    </nav>
  );
}
