import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Check, Compass, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export type OnboardingResult = {
  profileResponse: string;
  objectiveResponse: string;
};

const messages: Record<string, string> = {
  student:
    "Aprende com quem já está a construir e mostra ao mundo o que andas a criar.",
  "technology-professional":
    "O teu talento faz falta. Mostra o que constróis e encontra com quem construir a seguir.",
  founder:
    "Todo o grande produto começou pequeno. Partilha o teu e encontra quem o apoie.",
  investor:
    "Os próximos grandes produtos de Cabo Verde estão aqui. Descobre-os primeiro.",
};

const COLORS = ["#2563eb", "#4d7fff", "#f6c445", "#e23d3d", "#ffffff"];

function celebrate() {
  if (prefersReducedMotion()) return;
  const shot = (x: number, angle: number) =>
    confetti({ particleCount: 70, angle, spread: 65, startVelocity: 55, origin: { x, y: 0.75 }, colors: COLORS });
  shot(0, 60);
  shot(1, 120);
  setTimeout(() => confetti({ particleCount: 90, spread: 100, origin: { y: 0.4 }, colors: COLORS }), 250);
}

export function OnboardingSuccess({ result, ready }: { result: OnboardingResult; ready: boolean }) {
  const { data } = authClient.useSession();
  const user = data?.user;
  const firstName = user?.name?.split(" ")[0];
  const wantsToLaunch = result.objectiveResponse === "launch-product";
  // A dead photo URL would otherwise show the browser's broken-image icon.
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    celebrate();
    return () => {
      confetti.reset();
    };
  }, []);

  // The session is refreshed in the background; until it carries onboardedAt,
  // the dashboard guard would bounce the user back here.
  const linkClass = (primary: boolean) =>
    cn(
      buttonVariants({ size: "lg", variant: primary ? "default" : "outline" }),
      "group w-full sm:w-auto",
      !ready && "pointer-events-none opacity-50",
    );
  const explore = (
    <Link to="/" aria-disabled={!ready} className={linkClass(!wantsToLaunch)}>
      <Compass />
      Explorar projetos
    </Link>
  );
  const publish = (
    <Link to="/dashboard/submit" aria-disabled={!ready} className={linkClass(wantsToLaunch)}>
      <Plus />
      Publicar o meu primeiro projeto
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <div className="rounded-2xl border bg-card px-5 py-10 shadow-sm sm:px-10 sm:py-12">
        <button
          type="button"
          aria-label="Celebrar outra vez"
          onClick={celebrate}
          className="relative mx-auto block rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 animate-in zoom-in-50 fade-in-0 duration-500 ease-[cubic-bezier(0.3,1.5,0.5,1)]"
        >
          <span className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted text-3xl font-semibold text-muted-foreground ring-4 ring-primary-soft ring-offset-4 ring-offset-card">
            {user?.image && !imageFailed ? (
              <img
                src={user.image}
                alt=""
                className="size-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : firstName ? (
              firstName[0].toUpperCase()
            ) : (
              <UserRound className="size-10" />
            )}
          </span>
          <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground animate-in zoom-in-0 duration-300 delay-300 [animation-fill-mode:backwards]">
            <Check className="size-4" strokeWidth={3} />
          </span>
        </button>

        <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-150 [animation-fill-mode:backwards]">
          Bem-vindo{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-pretty text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-250 [animation-fill-mode:backwards]">
          Já fazes parte da comunidade que está a pôr Cabo Verde no mapa digital.{" "}
          {messages[result.profileResponse]}
        </p>

        {/* The suggested action follows the objective picked in onboarding;
            it sits on the right on desktop and on top on a phone. */}
        <div className="mt-8 flex flex-col-reverse justify-center gap-2 sm:flex-row animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400 [animation-fill-mode:backwards]">
          {wantsToLaunch ? explore : publish}
          {wantsToLaunch ? publish : explore}
        </div>
      </div>
    </div>
  );
}
