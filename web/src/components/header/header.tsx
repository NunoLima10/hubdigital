import { LoginButton } from "@/components/login-button/login-button";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Compass,
  LayoutDashboard,
  Map,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";

const ProjectSearch = lazy(() =>
  import("@/modules/project-list/components/project-search/project-search").then(
    (module) => ({ default: module.ProjectSearch }),
  ),
);

const navLinkClass = cn(
  buttonVariants({ variant: "ghost" }),
  "px-3 text-muted-foreground hover:text-foreground",
);

function ThemeToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
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
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const searchParams = useSearch({ strict: false });
  const navigate = useNavigate();
  const searchOpen = Boolean(searchParams.search);
  const setSearchOpen = useCallback(
    (open: boolean) =>
      void navigate({
        to: ".",
        search: (previous) => ({ ...previous, search: open || undefined }),
        replace: true,
      }),
    [navigate],
  );
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(document.documentElement.classList.contains("dark")),
    [],
  );
  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hubdigital-theme", next ? "dark" : "light");
    setDark(next);
  }
  const isDashboard = context === "dashboard";
  const showContextLink = isDashboard || Boolean(session);
  const contextLink = isDashboard
    ? { to: "/" as const, label: "Explorar", icon: Compass }
    : {
        to: "/dashboard/releases" as const,
        label: "Painel",
        icon: LayoutDashboard,
      };
  const avatar = (
    <span className="flex size-8 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold">
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
  }, [isDashboard, setSearchOpen]);
  return (
    <>
      <header className="border-b bg-background/95">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-0 px-4 md:gap-4 md:px-6">
          <Link
            to="/"
            aria-label="Hub Digital, página inicial"
            className="mr-auto shrink-0 rounded focus-visible:outline-2 focus-visible:outline-ring"
          >
            {/* On narrow phones the mark alone leaves room for both
                Entrar and Criar conta. */}
            <BrandLogo wordmarkClassName="max-[419px]:hidden" />
          </Link>
          {!isDashboard && (
            <Link
              to="/map"
              className={cn(navLinkClass, "hidden md:inline-flex")}
              aria-label="Mapa de projetos"
              title="Mapa de projetos"
            >
              <Map />
              Mapa
            </Link>
          )}
          {showContextLink && (
            <Link
              to={contextLink.to}
              className={cn(navLinkClass, "hidden md:inline-flex")}
              aria-label={contextLink.label}
              title={contextLink.label}
            >
              <ContextIcon />
              {contextLink.label}
            </Link>
          )}
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Procurar projetos"
            aria-keyshortcuts="Control+K Meta+K"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "font-normal text-muted-foreground hover:text-foreground lg:w-44 lg:justify-start lg:border-input lg:px-3 xl:w-52",
              isDashboard && "md:hidden",
            )}
          >
            <Search />
            <span className="hidden lg:inline">Procurar projetos</span>
          </button>
          {sessionPending ? (
            // The server cannot see the session cookie (it belongs to the API's
            // origin), so until the browser has asked, show neither the guest
            // buttons nor the avatar — either would flash into the other.
            <span
              aria-hidden
              className="mx-1.5 size-8 shrink-0 animate-pulse rounded-full bg-muted"
            />
          ) : session ? (
            // The dashboard has its own profile entry on desktop.
            <Link
              to="/dashboard/profile"
              aria-label="Abrir perfil"
              title={session.user.name}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                isDashboard && "md:hidden",
              )}
            >
              {avatar}
            </Link>
          ) : (
            <>
              {/* A modal, so signing in never loses the page the visitor is on. */}
              <LoginButton
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "px-2 sm:px-3",
                  isDashboard && "md:hidden",
                )}
              >
                Entrar
              </LoginButton>
              {/* Most visitors arrive on a phone, so sign-up stays one tap away
                  at every width. */}
              {!isDashboard && (
                <Link
                  to="/sign-up"
                  className={cn(buttonVariants(), "px-3")}
                >
                  <UserRound className="max-sm:hidden" />
                  Criar conta
                </Link>
              )}
            </>
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
