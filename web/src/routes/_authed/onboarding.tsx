import { privatePageHead } from "@/lib/seo";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { QuestionStepper } from "@/modules/onboarding/components/question-stepper/question-stepper";
import {
  OnboardingSuccess,
  type OnboardingResult,
} from "@/modules/onboarding/components/onboarding-success/onboarding-success";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authed/onboarding")({
  head: () => privatePageHead("Começar"),
  component: RouteComponent,
});

function RouteComponent() {
  const { useSession } = authClient;
  const { data, refetch } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const onboarded =
    data?.user && "onboardedAt" in data.user ? data.user.onboardedAt : null;

  // Once the answers are saved the session gains onboardedAt; keep showing the
  // welcome screen instead of redirecting straight away.
  if (onboarded && !result) return <Navigate to={"/dashboard/releases"} replace />;

  // Onboarding is forced after sign-in, so offer a way out for the wrong account.
  function signOut() {
    setIsSigningOut(true);
    void authClient.signOut().then(() => {
      window.location.href = "/";
    });
  }

  async function complete(answers: OnboardingResult) {
    setResult(answers);
    await authClient.getSession({ query: { disableCookieCache: true } });
    await refetch();
    setSessionReady(true);
  }

  const background =
    "min-h-screen bg-background bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_45%)]";

  // The welcome screen stands on its own: no header, centred, the brand below.
  if (result) {
    return (
      <main className={`${background} flex flex-col items-center justify-center px-4 py-12`}>
        <OnboardingSuccess result={result} ready={sessionReady} />
        <div className="mt-8 flex flex-col items-center gap-1.5 text-center animate-in fade-in-0 duration-700 delay-500 [animation-fill-mode:backwards]">
          <BrandLogo className="text-base" />
          <p className="text-sm text-muted-foreground">Feito em Cabo Verde, para o mundo.</p>
        </div>
      </main>
    );
  }

  return (
    <div className={`${background} flex flex-col`}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link to="/" aria-label="Hub Digital — página inicial">
          <BrandLogo className="text-lg" />
        </Link>
        <Button variant="ghost" size="sm" disabled={isSigningOut} onClick={signOut}>
          <LogOut />
          Sair
        </Button>
      </header>
      <main className="flex-1 px-4 pt-4 pb-12 sm:pt-10">
        <QuestionStepper onComplete={complete} />
      </main>
    </div>
  );
}
