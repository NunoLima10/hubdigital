import { Menu, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { useId, useState } from "react";
import { DashboardNav } from "../navbar/navbar";

export function SideBar() {
  const [open, setOpen] = useState(false);
  const navigationId = useId();
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
    <div className="rounded-lg border p-2 sm:p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between lg:hidden">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
          aria-label="Alternar navegação"
          aria-expanded={open}
          aria-controls={navigationId}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      <div
        id={navigationId}
        className={`${open ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.currentTarget.parentElement?.querySelector("button")?.focus();
          }
        }}
      >
        <DashboardNav />
      </div>
    </div>
  );
}
