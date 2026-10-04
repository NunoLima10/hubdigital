import { BarChart3, Heart, Rocket, Settings, UserRound } from "lucide-react";
import { NavLink } from "../nav-link/nav-link";

export function DashboardNav() {
  return (
    <nav aria-label="Dashboard" className="space-y-1">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
      <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
      <NavLink
        to="/dashboard/preferences"
        title="Preferências"
        icon={<Settings className="size-4" />}
      />
    </nav>
  );
}
