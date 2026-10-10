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
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hubdigital-theme", next ? "dark" : "light");
    setDark(next);
  }
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
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
        setMenuOpen(false);
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    function closeOutside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    const desktop = window.matchMedia("(min-width: 768px)");
    function closeOnDesktop() {
      if (desktop.matches) setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);
  return (
    <header ref={headerRef} className="border-b bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-0 px-4 md:gap-4 md:px-6">
        <Link
          to="/"
          className="mr-auto flex shrink-0 items-center gap-2 rounded font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => setMenuOpen(false)}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            H
          </span>
          HubDigital
        </Link>
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
        <Link
          to="/map"
          className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:inline-flex"
          aria-label="Mapa de projetos"
          title="Mapa de projetos"
        >
          <Map className="size-4" />
          <span className="hidden md:inline">Mapa</span>
        </Link>
        <Link
          to={hasAuthenticatedActions ? "/dashboard/profile" : "/sign-in"}
          onClick={() => setMenuOpen(false)}
          aria-label={hasAuthenticatedActions ? "Abrir perfil" : "Entrar"}
          title={hasAuthenticatedActions ? "Perfil" : "Entrar"}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:hidden"
        >
          <UserRound className="size-4" />
        </Link>
        <button
          type="button"
          onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
          aria-label="Procurar projetos"
          aria-keyshortcuts="Control+K Meta+K"
          className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-md border focus-visible:outline-2 focus-visible:outline-ring border-transparent text-sm text-muted-foreground hover:bg-muted hover:text-foreground lg:w-44 lg:justify-start lg:border-input lg:px-3 xl:w-52"
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Procurar projetos</span>
        </button>
        <div className="hidden md:block">
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
        </div>
        {hasAuthenticatedActions ? (
          <Link
            to="/dashboard/profile"
            className="hidden size-11 shrink-0 md:flex items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring"
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
            className="hidden text-sm font-medium hover:text-primary md:block"
          >
            Entrar
          </Link>
        )}
        {!hasAuthenticatedActions && (
          <Link
            to="/sign-up"
            className="hidden h-11 shrink-0 items-center gap-2 md:inline-flex rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            <UserRound className="size-4" />
            Criar conta
          </Link>
        )}
        <Button
          ref={menuButtonRef}
          className="size-11 md:hidden"
          size="icon"
          variant="ghost"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>
      {menuOpen && (
        <nav
          id={menuId}
          className="flex flex-col gap-1 border-t px-4 py-2 text-sm md:hidden"
          aria-label="Navegação móvel"
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Compass className="size-4" /> Explorar
          </Link>
          <Link
            to="/map"
            onClick={() => setMenuOpen(false)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Map className="size-4" /> Mapa
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar esquema de cores"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Tema
          </button>
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
