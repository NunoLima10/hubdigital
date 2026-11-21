import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { SignedIn } from "@/components/signed-in/signed-in";
import { SignedOut } from "@/components/signed-out/signed-out";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaunchCampaign } from "@/modules/project-list/hooks/use-launch-campaign";
import { Link } from "@tanstack/react-router";
import { CircleCheck, Gift } from "lucide-react";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] focus-visible:ring-offset-2";

/** The partner's logo on a white pill, so it reads in both themes. */
export function CvDomainsLogo({ className = "h-5" }: Readonly<{ className?: string }>) {
  return (
    <a
      href="https://ola.cv/"
      target="_blank"
      rel="noopener"
      aria-label="Ola.cv (abre num novo separador)"
      className={`inline-flex items-center rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow ${focusRing}`}
    >
      <img src="/partners/cv-domains.png" alt="Ola.cv" className={`${className} w-auto`} />
    </a>
  );
}

/**
 * Temporary: launch raffle of five .cv domains among the first 100 accounts,
 * with a live progress bar toward the goal. Remove with the API's
 * launch-campaign module after the draw.
 */
export function LaunchRaffleCard() {
  const { data, isPending, isError } = useLaunchCampaign();
  if (isError) return null;

  const users = data ? Math.min(data.users, data.goal) : 0;
  const goal = data?.goal ?? 100;
  const prizes = data?.prizes ?? 5;
  const percent = Math.round((users / goal) * 100);
  const remaining = Math.max(goal - users, 0);

  return (
    <section
      aria-labelledby="launch-raffle-title"
      className="relative overflow-hidden rounded-xl border border-[#1A73E8]/25 bg-[#F2F7FF] text-[#0B2A55] dark:border-[#6FA8FF]/25 dark:bg-[#0C1C33] dark:text-[#E8F1FF]"
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <CvDomainsLogo />
          <Link
            to="/patrocinios"
            hash="sorteio"
            className={`rounded-md px-2 py-1 text-xs font-medium text-[#1A5BC4] underline-offset-4 hover:underline dark:text-[#A9CBFF] ${focusRing}`}
          >
            Saber mais
          </Link>
        </div>

        <h2 id="launch-raffle-title" className="text-lg font-semibold leading-snug tracking-tight">
          {prizes} domínios .cv para sortear
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#3B5578] dark:text-[#B5C8E4]">
          Com a Ola.cv, vamos sortear {prizes} domínios entre os primeiros {goal} membros
          do Hub.
        </p>

        <div className="mt-4">
          {isPending ? (
            <div role="status" aria-label="A carregar progresso">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-semibold tabular-nums">
                  <RollingNumber value={users} /> / {goal} membros
                </span>
                <span className="text-xs text-[#3B5578] dark:text-[#B5C8E4]">
                  {data?.reached ? "Meta atingida" : `Faltam ${remaining}`}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Membros inscritos até à meta do sorteio"
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-valuenow={users}
                aria-valuetext={`${users} de ${goal} membros`}
                className="h-2.5 overflow-hidden rounded-full bg-[#1A73E8]/15 dark:bg-[#6FA8FF]/15"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1A73E8] to-[#4C9BFF] motion-safe:transition-[width] motion-safe:duration-700"
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
            </>
          )}
        </div>

        <SignedOut>
          <Link
            to="/sign-up"
            className={`group mt-4 flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#1A73E8] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1660C4] motion-reduce:transition-none ${focusRing}`}
          >
            <Gift
              className="size-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110"
              aria-hidden="true"
            />
            Criar conta e participar
          </Link>
        </SignedOut>
        <SignedIn>
          <p className="mt-4 flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#1A73E8]/25 px-3 py-2 text-sm font-medium text-[#1A5BC4] dark:border-[#6FA8FF]/25 dark:text-[#A9CBFF]">
            <CircleCheck className="size-4" aria-hidden="true" />
            Já estás a participar
          </p>
        </SignedIn>
      </div>
    </section>
  );
}
