import { BadgeMedal } from "@/components/badge/badge-medal";
import { cn } from "@/lib/utils";
import { badgeCatalog, type BadgeKey } from "@hubdigital/shared";
import { EyeOff } from "lucide-react";
import { useEffect } from "react";
import { useFeatureBadge, useMyBadges } from "../hooks/use-my-badges";

/**
 * Lets the user pick which of their badges appears next to their name on the
 * profile and in comments, or hide them all.
 */
export function BadgePicker() {
  const { data: badges, isPending } = useMyBadges();
  const { featureBadge, isPending: isSaving } = useFeatureBadge();
  const loaded = !isPending;

  // Linked as /dashboard/profile#badges (from the badge celebration). The
  // browser jumps before the forms above have loaded and pushed the section
  // down, so keep it in view while the page settles, until the user scrolls.
  useEffect(() => {
    if (!loaded || window.location.hash !== "#badges") return;
    const section = document.getElementById("badges");
    if (!section) return;

    const land = () => section.scrollIntoView({ block: "start" });
    const observer = new ResizeObserver(land);
    const stop = () => {
      observer.disconnect();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };

    land();
    observer.observe(document.body);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const timer = window.setTimeout(stop, 1500);

    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [loaded]);

  if (isPending) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  }

  if (!badges?.length) {
    return (
      <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
        Ainda não tens distintivos. Os primeiros 100 membros recebem um
        automaticamente, e outros são atribuídos pela equipa do Hub Digital.
      </p>
    );
  }

  const featured = badges.find((badge) => badge.featured)?.key ?? null;

  const option = (key: BadgeKey | null) => {
    const selected = featured === key;
    const badge = key ? badgeCatalog[key] : null;
    return (
      <label
        key={key ?? "none"}
        className={cn(
          "badge-hover relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          selected ? "border-primary bg-primary/5" : "hover:bg-muted/60",
          isSaving && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="radio"
          name="featured-badge"
          className="sr-only"
          checked={selected}
          onChange={() => featureBadge(key)}
        />
        {key ? (
          <BadgeMedal badgeKey={key} className="size-16" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <EyeOff className="size-6" />
          </span>
        )}
        <span className="text-sm font-medium">{badge?.name ?? "Nenhum"}</span>
        <span className="text-xs text-muted-foreground">
          {badge?.material ?? "Não mostrar"}
        </span>
      </label>
    );
  };

  return (
    <fieldset>
      <legend className="sr-only">Distintivo visível no perfil</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((badge) => option(badge.key))}
        {option(null)}
      </div>
    </fieldset>
  );
}
