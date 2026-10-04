import { Menu } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardNav } from "../navbar/navbar";

export function SideBar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const pageTitle = pathname.startsWith("/dashboard/metrics")
    ? "Desempenho"
    : pathname.startsWith("/dashboard/favorites")
      ? "Favoritos"
      : pathname.startsWith("/dashboard/preferences")
        ? "Preferências"
    : pathname.startsWith("/dashboard/profile")
      ? "Perfil público"
      : pathname.startsWith("/dashboard/submit")
        ? "Submeter projeto"
        : "Lançamentos";

  return (
    <div className="rounded-lg border p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between lg:hidden">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <button
          className="rounded p-2 hover:bg-muted lg:hidden"
          aria-label="Alternar navegação"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Menu className="size-4" />
        </button>
      </div>
      <div className={`${open ? "block" : "hidden"} lg:block`}>
        <DashboardNav />
      </div>
    </div>
  );
}
