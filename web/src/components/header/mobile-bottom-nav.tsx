import { authClient } from "@/lib/auth-client";
import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, LayoutDashboard, Map } from "lucide-react";

const destinations = [
  { to: "/", label: "Explorar", icon: Compass, section: "explorer" },
  { to: "/map", label: "Mapa", icon: Map, section: "map" },
  { to: "/dashboard/releases", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
] as const;

export function MobileBottomNav() {
  const { data: session } = authClient.useSession();
  const visibleDestinations = destinations.filter((destination) =>
    destination.section !== "dashboard" || Boolean(session),
  );
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const section = pathname.startsWith("/dashboard")
    ? "dashboard"
    : pathname === "/map" ? "map" : "explorer";

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-[1100] border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className={`grid h-14 ${session ? "grid-cols-3" : "grid-cols-2"}`}>
        {visibleDestinations.map(({ to, label, icon: Icon, section: destination }) => (
          <Link
            key={to}
            to={to}
            aria-current={section === destination ? "page" : undefined}
            activeOptions={{ exact: true }}
            activeProps={{ "aria-current": section === destination ? "page" : undefined }}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${section === destination ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
