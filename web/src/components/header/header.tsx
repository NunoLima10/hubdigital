import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  LayoutDashboard,
  Map,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

const ProjectSearch = lazy(() =>
  import("@/modules/project-list/components/project-search/project-search").then(
    (module) => ({ default: module.ProjectSearch }),
  ),
);

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      onClick={onToggle}
      aria-label="Alternar esquema de cores"
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function Header({
  context = "explorer",
}: {
  context?: "explorer" | "dashboard";
}) {
  const { data: session } = authClient.useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hubdigital-theme", next ? "dark" : "light");
    setDark(next);
  }
  const isDashboard = context === "dashboard";
  const hasAuthenticatedActions = isDashboard || Boolean(session);
  const showContextLink = isDashboard || Boolean(session);
  const contextLink = isDashboard
    ? { to: "/" as const, label: "Explorar", icon: Compass }
    : {
        to: "/dashboard/releases" as const,
        label: "Dashboard",
        icon: LayoutDashboard,
      };
  const avatar = (
    <span className="flex size-8 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold">
      {session?.user.image ? (
        <img src={session.user.image} alt="" className="size-full object-cover" />
      ) : (
        session?.user.name?.[0]?.toUpperCase() ?? <UserRound className="size-4" />
      )}
    </span>
  );
  const ContextIcon = contextLink.icon;
  useEffect(() => {
    if (isDashboard) return;
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, [isDashboard]);
  return (
    <>
    <header className="border-b bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-0 px-4 md:gap-4 md:px-6">
        <Link
          to="/"
          className="mr-auto flex shrink-0 items-center gap-2 rounded font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            H
          </span>
          HubDigital
        </Link>
        {!isDashboard && (
        <Link
          to="/map"
          className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:inline-flex"
          aria-label="Mapa de projetos"
          title="Mapa de projetos"
        >
          <Map className="size-4" />
          <span className="hidden md:inline">Mapa</span>
        </Link>
        )}
        {showContextLink && (
          <Link
            to={contextLink.to}
            className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:inline-flex"
            aria-label={contextLink.label}
            title={contextLink.label}
          >
            <ContextIcon className="size-4" />
            <span className="hidden md:inline">{contextLink.label}</span>
          </Link>
        )}
        <div>
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Procurar projetos"
          aria-keyshortcuts="Control+K Meta+K"
          className={`${isDashboard ? "md:hidden" : ""} inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-md border focus-visible:outline-2 focus-visible:outline-ring border-transparent text-sm text-muted-foreground hover:bg-muted hover:text-foreground lg:w-44 lg:justify-start lg:border-input lg:px-3 xl:w-52`}
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Procurar projetos</span>
        </button>
          <Link
            to={session ? "/dashboard/profile" : "/sign-in"}
              aria-label={session ? "Abrir perfil" : "Entrar"}
            title={session ? session.user.name : "Entrar"}
            className={session
              ? "inline-flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-ring md:hidden"
              : "inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-ring md:hidden"}
          >
            {session ? avatar : "Entrar"}
          </Link>
        {!isDashboard && (session ? (
          <Link
            to="/dashboard/profile"
            className="hidden size-11 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-ring md:flex"
            aria-label="Abrir perfil"
            title={session.user.name}
          >
            {avatar}
          </Link>
        ) : (
          <Link
            to="/sign-in"
            className="hidden text-sm font-medium hover:text-primary md:block"
          >
            Entrar
          </Link>
        ))}
        {!hasAuthenticatedActions && (
          <Link
            to="/sign-up"
            className="hidden h-11 shrink-0 items-center gap-2 md:inline-flex rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            <UserRound className="size-4" />
            Criar conta
          </Link>
        )}
      </div>
      {searchOpen && (
        <Suspense fallback={null}>
          <ProjectSearch onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
    <MobileBottomNav />
    </>
  );
}
