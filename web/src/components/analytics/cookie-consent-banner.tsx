import { Button } from "@/components/ui/button";
import { useAnalyticsConsent } from "@/lib/analytics-consent";
import { analyticsEnabled, setAnalyticsConsent } from "@/lib/posthog";
import { Link } from "@tanstack/react-router";

/**
 * Asks once whether PostHog may use analytics cookies. Both answers carry the
 * same weight: refusing keeps anonymous, cookieless counting. Hidden when
 * PostHog is not configured, and until the stored answer has been read.
 */
export function CookieConsentBanner() {
  const consent = useAnalyticsConsent();
  if (!analyticsEnabled || consent !== null) return null;

  return (
    <section
      aria-label="Cookies analíticos"
      className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[1101] mx-auto max-w-xl rounded-lg border bg-background p-4 shadow-lg md:inset-x-auto md:right-6 md:bottom-6"
    >
      <p className="text-sm font-semibold">Cookies analíticos</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Com a tua autorização, usamos cookies do PostHog para perceber como o Hub Digital é usado
        e melhorá-lo, sem guardar o teu nome nem email. Se recusares, contamos visitas de forma
        anónima, sem cookies.{" "}
        <Link
          to="/privacidade"
          hash="armazenamento-local"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Saber mais
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setAnalyticsConsent("denied")}
        >
          Recusar
        </Button>
        <Button className="flex-1" onClick={() => setAnalyticsConsent("granted")}>
          Aceitar
        </Button>
      </div>
    </section>
  );
}
