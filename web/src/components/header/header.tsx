import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  LayoutDashboard,
  Map,
  Menu,
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

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(document.documentElement.classList.contains("dark")),
    [],
  );
  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hubdigital-theme", next ? "dark" : "light");
    setDark(next);
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
  const ContextIcon = contextLink.icon;
  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 md:gap-4 md:px-6">
        <Link
          to="/"
          className="mr-auto flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            H
          </span>
          HubDigital
        </Link>
        {showContextLink && (
          <Link
            to={contextLink.to}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:w-auto md:gap-2 md:px-3"
            aria-label={contextLink.label}
            title={contextLink.label}
          >
            <ContextIcon className="size-4" />
            <span className="hidden md:inline">{contextLink.label}</span>
          </Link>
        )}
        <Link
          to="/map"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:w-auto md:gap-2 md:px-3"
          aria-label="Mapa de projetos"
          title="Mapa de projetos"
        >
          <Map className="size-4" />
          <span className="hidden md:inline">Mapa</span>
        </Link>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Procurar projetos"
          aria-keyshortcuts="Control+K Meta+K"
          className="inline-flex size-9 shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm text-muted-foreground hover:bg-muted hover:text-foreground lg:w-44 lg:justify-start lg:border-input lg:px-3 xl:w-52"
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Procurar projetos</span>
        </button>
        <div className={hasAuthenticatedActions ? "block" : "hidden sm:block"}>
          <ThemeToggle />
        </div>
        {hasAuthenticatedActions ? (
          <Link
            to="/dashboard/profile"
            className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold hover:bg-muted/70"
            aria-label="Abrir perfil"
            title="Perfil"
          >
            {session?.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              (session?.user.name?.[0]?.toUpperCase() ?? (
                <UserRound className="size-4" />
              ))
            )}
          </Link>
        ) : (
          <Link
            to="/sign-in"
            className="hidden text-sm font-medium hover:text-primary sm:block"
          >
            Entrar
          </Link>
        )}
        {!hasAuthenticatedActions && (
          <Link
            to="/sign-up"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            <UserRound className="size-4" />
            Criar conta
          </Link>
        )}
        {!hasAuthenticatedActions && (
          <Button
            className="md:hidden"
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu />
          </Button>
        )}
      </div>
      {menuOpen && !hasAuthenticatedActions && (
        <nav
          className="flex flex-col gap-1 border-t px-4 py-3 text-sm md:hidden"
          aria-label="Navegação móvel"
        >
          {showContextLink && (
            <Link
              to={contextLink.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded px-2 py-2 hover:bg-muted"
            >
              <ContextIcon className="size-4" />
              {contextLink.label}
            </Link>
          )}
          {!hasAuthenticatedActions && (
            <Link
              to="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="rounded px-2 py-2 hover:bg-muted"
            >
              Entrar
            </Link>
          )}
          {hasAuthenticatedActions && (
            <Link
              to="/dashboard/profile"
              onClick={() => setMenuOpen(false)}
              className="rounded px-2 py-2 hover:bg-muted"
            >
              Perfil
            </Link>
          )}
          <div className="flex items-center justify-between px-2 py-1 sm:hidden">
            <span>Tema</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
      {searchOpen && (
        <Suspense fallback={null}>
          <ProjectSearch onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
  );
}
