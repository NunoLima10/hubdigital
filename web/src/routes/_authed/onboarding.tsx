import { privatePageHead } from "@/lib/seo";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { QuestionStepper } from "@/modules/onboarding/components/question-stepper/question-stepper";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authed/onboarding")({
  head: () => privatePageHead("Começar"),
  component: RouteComponent,
});

function RouteComponent() {
  const { useSession } = authClient;
  const { data } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const onboarded =
    data?.user && "onboardedAt" in data.user ? data.user.onboardedAt : null;

  if (onboarded) return <Navigate to={"/dashboard/releases"} replace />;

  // Onboarding is forced after sign-in, so offer a way out for the wrong account.
  function signOut() {
    setIsSigningOut(true);
    void authClient.signOut().then(() => {
      window.location.href = "/";
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-[radial-gradient(circle_at_100%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_45%)]">
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
        <QuestionStepper />
      </main>
    </div>
  );
}
