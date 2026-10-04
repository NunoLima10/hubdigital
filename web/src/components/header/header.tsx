import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Plus, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

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

export function Header() {
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  function signOut() {
    void authClient.signOut().then(() => {
      window.location.href = "/";
    });
  }
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        <Link
          to="/"
          className="mr-auto flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            H
          </span>
          HubDigital
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm md:flex"
          aria-label="Navegação principal"
        >
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Explorar
          </Link>
          <Link
            to="/dashboard/submit"
            className="text-muted-foreground hover:text-foreground"
          >
            Submeter projeto
          </Link>
        </nav>
        <ThemeToggle />
        {session ? (
          <details className="relative hidden sm:block">
            <summary
              className="flex size-9 list-none items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold hover:bg-muted/70"
              aria-label="Menu da conta"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                (session.user.name?.[0]?.toUpperCase() ?? (
                  <UserRound className="size-4" />
                ))
              )}
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border bg-popover p-2 text-sm shadow-lg">
              <p className="truncate px-2 py-1 font-semibold">
                {session.user.name}
              </p>
              <p className="truncate px-2 pb-2 text-xs text-muted-foreground">
                {session.user.email}
              </p>
              <Link
                to="/dashboard/releases"
                className="block rounded px-2 py-2 hover:bg-muted"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/profile"
                className="block rounded px-2 py-2 hover:bg-muted"
              >
                Perfil
              </Link>
              <button
                onClick={signOut}
                className="w-full rounded px-2 py-2 text-left hover:bg-muted"
              >
                Terminar sessão
              </button>
            </div>
          </details>
        ) : (
          <Link
            to="/sign-in"
            className="hidden text-sm font-medium hover:text-primary sm:block"
          >
            Entrar
          </Link>
        )}
        <Link
          to={session ? "/dashboard/submit" : "/sign-up"}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85"
        >
          {session ? (
            <Plus className="size-4" />
          ) : (
            <UserRound className="size-4" />
          )}
          {session ? "Submeter" : "Criar conta"}
        </Link>
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
      </div>
      {menuOpen && (
        <nav
          className="flex flex-col gap-1 border-t px-4 py-3 text-sm md:hidden"
          aria-label="Navegação móvel"
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="rounded px-2 py-2 hover:bg-muted"
          >
            Explorar
          </Link>
          <Link
            to="/dashboard/submit"
            onClick={() => setMenuOpen(false)}
            className="rounded px-2 py-2 hover:bg-muted"
          >
            Submeter projeto
          </Link>
          <Link
            to={session ? "/dashboard/releases" : "/sign-in"}
            onClick={() => setMenuOpen(false)}
            className="rounded px-2 py-2 hover:bg-muted"
          >
            {session ? "Dashboard" : "Entrar"}
          </Link>
          {session && (
            <button
              onClick={signOut}
              className="rounded px-2 py-2 text-left hover:bg-muted"
            >
              Terminar sessão
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
