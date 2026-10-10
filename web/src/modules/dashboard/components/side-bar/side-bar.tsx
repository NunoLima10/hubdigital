import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { DashboardNav } from "../navbar/navbar";

export function SideBar() {
  const navigationRef = useRef<HTMLDivElement>(null);
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


  useEffect(() => {
    const container = navigationRef.current;
    const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!container || !active || window.matchMedia("(min-width: 1024px)").matches) return;
    const containerBounds = container.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    if (activeBounds.left < containerBounds.left) {
      container.scrollLeft -= containerBounds.left - activeBounds.left + 4;
    } else if (activeBounds.right > containerBounds.right) {
      container.scrollLeft += activeBounds.right - containerBounds.right + 4;
    }
  }, [pathname]);

  return (
    <div className="min-w-0 lg:sticky lg:top-6 lg:rounded-lg lg:border lg:p-4">
      <h1 className="mb-3 text-xl font-semibold lg:hidden">{pageTitle}</h1>
      <div
        ref={navigationRef}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b pb-2 lg:overflow-visible lg:border-0 lg:pb-0"
      >
        <DashboardNav />
      </div>
    </div>
  );
}
