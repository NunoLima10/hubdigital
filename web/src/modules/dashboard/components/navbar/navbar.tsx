import { BarChart3, Heart, Rocket, UserRound, Users } from "lucide-react";
import { useReceivedInvitations } from "@/modules/invitations/hooks/use-invitations";
import { NavLink } from "../nav-link/nav-link";

export function DashboardNav() {
  const { data: invitations } = useReceivedInvitations();
  return (
    <nav aria-label="Painel" className="flex w-max gap-1 px-0.5 lg:block lg:w-auto lg:space-y-1 lg:px-0">
      <p className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Área de trabalho
      </p>
      <NavLink
        to="/dashboard/releases"
        title="Projetos"
        icon={<Rocket className="size-4" />}
      />
      <NavLink
        to="/dashboard/metrics"
        title="Métricas"
        icon={<BarChart3 className="size-4" />}
      />
      <NavLink
        to="/dashboard/community"
        title="Comunidade"
        icon={<Users className="size-4" />}
        badge={invitations?.length}
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
