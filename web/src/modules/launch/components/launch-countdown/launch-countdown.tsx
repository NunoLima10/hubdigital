import { LogoMark } from "@/components/brand-logo/brand-logo";
import { cn } from "@/lib/utils";
import { PROJECT_REPOSITORY } from "@/modules/project-list/hooks/use-github-stars";
import { lazy, Suspense, useEffect, useState } from "react";

// WebGL (three.js) background, loaded only in the browser so three stays out
// of the server render and the main bundle.
// The download starts as soon as this module runs in the browser, not when
// the component mounts after hydration, so the bands show up sooner.
const loadColorBends = () => import("@/components/ColorBends");
if (typeof window !== "undefined") void loadColorBends();
const ColorBends = lazy(loadColorBends);

// Brand cobalt (light and dark tokens) for the bands.
const BEND_COLORS = ["#024bff", "#4d7fff"];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Days, hours and minutes left until `launchAt`, never below zero. */
export function timeLeft(launchAt: Date, now: number) {
  const ms = Math.max(0, launchAt.getTime() - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / HOUR),
    // Round minutes up so the page reads 00:00:01 until the very last minute.
    minutes: Math.ceil((ms % HOUR) / MINUTE) % 60,
  };
}

/**
 * The page shown instead of the site while it is locked before launch (see
 * modules/launch/components/launch-gate): the brand, a days:hours:minutes
 * countdown over animated cobalt bands (React Bits ColorBends).
 *
 * Without a usable date — or once the countdown is over and the site is still
 * closed — it says "Em breve" instead of showing a timer.
 *
 * `initialNow` is the API's clock at the time of the request: the server
 * render and the first browser render both count from it, so the HTML already
 * holds the real numbers and hydration matches. The browser's clock takes
 * over right after. Without it the first render shows placeholders.
 */
export function LaunchCountdown({
  launchAt,
  initialNow,
  className,
}: {
  launchAt: Date | null;
  initialNow?: number;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(
    initialNow !== undefined && !Number.isNaN(initialNow) ? initialNow : null,
  );
  // The WebGL background exists only in the browser.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = now === null || launchAt === null ? null : timeLeft(launchAt, now);
  // Placeholders until the clock starts; "Em breve" with no date or time left.
  const showTimer = launchAt !== null && !left?.done;
  const units = [
    { label: left?.days === 1 ? "dia" : "dias", value: left?.days },
    { label: left?.hours === 1 ? "hora" : "horas", value: left?.hours },
    { label: left?.minutes === 1 ? "minuto" : "minutos", value: left?.minutes },
  ];

  return (
    <div
      className={cn(
        "dark relative isolate flex min-h-screen flex-col overflow-hidden bg-background text-white",
        className,
      )}
    >
      {/* Animated cobalt bands behind everything; a scrim keeps text readable. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Static cobalt glow, in the HTML from the start, so the page is never
            flat black while the WebGL bands load; they fade in over it. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_15%_35%,color-mix(in_oklch,#024bff_35%,transparent),transparent_70%),radial-gradient(ellipse_60%_40%_at_85%_70%,color-mix(in_oklch,#4d7fff_28%,transparent),transparent_70%)]" />
        {mounted && (
          <Suspense fallback={null}>
            <div className="absolute inset-0 animate-in fade-in-0 duration-700">
              <ColorBends colors={BEND_COLORS} speed={0.15} intensity={1.2} noise={0.1} mouseInfluence={0} parallax={0} />
            </div>
          </Suspense>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--background)_70%,transparent)_20%,transparent_75%)]" />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="hub-lift inline-flex items-center gap-[0.35em] text-2xl leading-none font-semibold tracking-tight sm:text-3xl md:text-4xl animate-in fade-in-0 duration-500">
          <LogoMark className="size-[1.15em]" />
          Hub Digital
        </h1>
        <p className="mt-4 max-w-xl text-lg font-medium tracking-tight text-balance text-white sm:text-xl md:text-2xl">
          Todos os projetos tecnológicos de Cabo Verde, num só lugar.
        </p>

        {showTimer ? (
          <div
            role="timer"
            aria-live="off"
            aria-label={
              left
                ? `Abre em ${left.days} dias, ${left.hours} horas e ${left.minutes} minutos`
                : undefined
            }
            className="mt-10 grid grid-cols-[auto_auto_auto_auto_auto] items-start gap-x-2 sm:gap-x-4 md:mt-14 md:gap-x-6 animate-in fade-in-0 duration-500"
          >
            {units.map((unit, i) => (
              <Unit key={i} value={unit.value} label={unit.label} colon={i > 0} />
            ))}
          </div>
        ) : (
          <p className="launch-digits mt-10 px-[0.06em] py-[0.08em] text-[clamp(3rem,13vw,8.5rem)] leading-none font-extrabold tracking-tight md:mt-14 animate-in fade-in-0 duration-500">
            Em breve
          </p>
        )}

        <p className="mt-10 max-w-md text-base text-pretty text-white md:mt-14">
          Descobre o que se está a criar, mostra o que fazes e encontra com quem construir.
        </p>
      </main>

      <footer className="px-6 pb-6 text-center text-xs text-white">
        O Hub é de{" "}
        <a
          href={PROJECT_REPOSITORY}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
        >
          código aberto
        </a>{" "}
        e feito pela comunidade.
      </footer>
    </div>
  );
}

function Unit({
  value,
  label,
  colon,
}: {
  value: number | undefined;
  label: string;
  colon: boolean;
}) {
  return (
    <>
      {colon && (
        <span
          aria-hidden="true"
          className="flex h-[1em] flex-col justify-center gap-[0.18em] text-[clamp(3rem,13vw,8.5rem)] leading-none"
        >
          <span className="mx-auto size-[0.1em] rounded-full bg-white" />
          <span className="mx-auto size-[0.1em] rounded-full bg-white" />
        </span>
      )}
      <span className="flex flex-col items-center">
        <span className="launch-digits -my-[0.08em] px-[0.06em] py-[0.08em] text-[clamp(3rem,13vw,8.5rem)] leading-none font-extrabold tracking-tight tabular-nums">
          {value === undefined ? "--" : String(value).padStart(2, "0")}
        </span>
        <span className="mt-2 text-xs font-medium tracking-[0.14em] text-white uppercase sm:text-sm md:mt-3">
          {label}
        </span>
      </span>
    </>
  );
}
