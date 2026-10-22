import { Button } from "@/components/ui/button";
import { CountryCombobox } from "@/components/country-combobox/country-combobox";
import { CountryFlag } from "@/components/country-flag/country-flag";
import { IslandIcon } from "@/components/island-icon/island-icon";
import { LogoMark } from "@/components/brand-logo/brand-logo";
import { SparkBurst, type SparkBurstHandle } from "@/components/spark-burst/spark-burst";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { islandValues, type Island } from "@hubdigital/shared";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CodeXml,
  Compass,
  Globe,
  GraduationCap,
  HandCoins,
  Megaphone,
  MessageCircleHeart,
  Pencil,
  Rocket,
  Search,
  Telescope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  addTransitionType,
  startTransition,
  useEffect,
  useRef,
  useState,
  ViewTransition,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  diasporaCountryLabels,
  diasporaCountryValues,
  featuredDiasporaCountries,
  onBoardingQuestions,
} from "../../questions";
import {
  useCreateOnboarding,
  type OnboardingResponse,
} from "../../hooks/use-create-onboarding";

type AnswerKey =
  | "profileResponse"
  | "objectiveResponse"
  | "locationResponse"
  | "foundUsByResponse";
const keys: AnswerKey[] = [
  "profileResponse",
  "objectiveResponse",
  "locationResponse",
  "foundUsByResponse",
];
const LAST_STEP = keys.length;
type DiasporaCountry = (typeof diasporaCountryValues)[number];

const responseIcons: Record<string, LucideIcon> = {
  student: GraduationCap,
  "technology-professional": CodeXml,
  founder: Rocket,
  investor: HandCoins,
  "discover-products": Compass,
  "launch-product": Megaphone,
  networking: UsersRound,
  explore: Telescope,
  diaspora: Globe,
  "social-media": MessageCircleHeart,
  friends: UsersRound,
  event: CalendarDays,
  "online-search": Search,
};

const isIsland = (value: string): value is Island =>
  (islandValues as readonly string[]).includes(value);

function ResponseIcon({ value }: { value: string }) {
  if (isIsland(value)) return <IslandIcon island={value} className="size-6" />;
  const Icon = responseIcons[value];
  return Icon ? <Icon className="size-5" /> : null;
}

// Long enough to see the choice land before the next question slides in.
const AUTO_ADVANCE_MS = 320;

export function QuestionStepper() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    profileResponse: "",
    objectiveResponse: "",
    locationResponse: "",
    foundUsByResponse: "",
  });
  const [diasporaCountry, setDiasporaCountry] = useState<DiasporaCountry | "">("");
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sparks = useRef<SparkBurstHandle>(null);
  const navigate = useNavigate();
  const { refetch } = authClient.useSession();
  const { createOnboarding, schema, isPending } = useCreateOnboarding({
    onSuccess: async () => {
      await authClient.getSession({ query: { disableCookieCache: true } });
      await refetch();
      navigate({ to: "/dashboard/releases" });
    },
  });
  const question = onBoardingQuestions[step];
  const showDiaspora = step === 2 && answers.locationResponse === "diaspora";

  useEffect(() => () => clearTimeout(advanceTimer.current), []);
  useEffect(() => {
    if (step === LAST_STEP) sparks.current?.burst();
  }, [step]);

  function goTo(next: number) {
    clearTimeout(advanceTimer.current);
    startTransition(() => {
      addTransitionType(next > step ? "onboarding-forward" : "onboarding-backward");
      setStep(next);
    });
  }

  function choose(value: string) {
    setAnswers((current) => ({ ...current, [keys[step]]: value }));
    if (step === 2 && value !== "diaspora") setDiasporaCountry("");
  }

  function submit() {
    const parsed = schema.safeParse({
      bio: "",
      ...answers,
      diasporaCountry: diasporaCountry || undefined,
    });
    if (!parsed.success) {
      toast.error("Escolhe uma opção em cada passo.");
      return;
    }
    createOnboarding(parsed.data as OnboardingResponse);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-label="Progresso"
            aria-valuemin={0}
            aria-valuemax={LAST_STEP}
            aria-valuenow={step}
          >
            {keys.map((key, index) => (
              <span key={key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn(
                    "block h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    index < step || (index === step && answers[key]) ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </span>
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {step < LAST_STEP ? `${step + 1}/${LAST_STEP}` : "Pronto"}
          </span>
        </div>

        <ViewTransition
          default="none"
          update={{
            default: "none",
            "onboarding-forward": "step-forward",
            "onboarding-backward": "step-backward",
          }}
        >
          <div className="mt-7">
            {step < LAST_STEP ? (
              <fieldset>
                <legend className="text-2xl font-semibold tracking-tight text-balance">
                  {question.title}
                </legend>
                {showDiaspora ? (
                  <div className="mt-6 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        Em que país?{" "}
                        <span className="font-normal text-muted-foreground">(opcional)</span>
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          choose("");
                          setDiasporaCountry("");
                        }}
                      >
                        <ArrowLeft className="size-3.5" />
                        Voltar às ilhas
                      </button>
                    </div>
                    <CountryCombobox
                      aria-label="País onde vives"
                      countries={diasporaCountryValues}
                      featured={featuredDiasporaCountries}
                      value={diasporaCountry}
                      onChange={(country) => setDiasporaCountry(country as DiasporaCountry | "")}
                    />
                  </div>
                ) : (
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {question.reponses.map((response) => (
                      <OptionCard
                        key={response.value}
                        name={keys[step]}
                        value={response.value}
                        checked={answers[keys[step]] === response.value}
                        icon={<ResponseIcon value={response.value} />}
                        onSelect={() => choose(response.value)}
                        onPick={() => {
                          // Diaspora still asks for a country on this step.
                          if (response.value === "diaspora") return;
                          clearTimeout(advanceTimer.current);
                          advanceTimer.current = setTimeout(() => goTo(step + 1), AUTO_ADVANCE_MS);
                        }}
                      >
                        {response.display}
                      </OptionCard>
                    ))}
                  </div>
                )}
              </fieldset>
            ) : (
              <div>
                <div className="relative inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary animate-in zoom-in-50 duration-500">
                  <LogoMark className="size-7" />
                  <SparkBurst ref={sparks} count={10} distance={40} delay={150} className="text-primary" />
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight">Tudo pronto!</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Confirma as tuas respostas. Podes alterá-las antes de entrar.
                </p>
                <dl className="mt-6 divide-y rounded-xl border">
                  {keys.map((key, index) => {
                    const answer = onBoardingQuestions[index].reponses.find(
                      (response) => response.value === answers[key],
                    );
                    return (
                      <div key={key} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          {key === "locationResponse" && diasporaCountry ? (
                            <CountryFlag country={diasporaCountry} className="text-lg" />
                          ) : (
                            <ResponseIcon value={answers[key]} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <dt className="text-xs text-muted-foreground">
                            {onBoardingQuestions[index].title}
                          </dt>
                          <dd className="truncate text-sm font-medium">
                            {answer?.display}
                            {key === "locationResponse" && diasporaCountry
                              ? ` · ${diasporaCountryLabels[diasporaCountry]}`
                              : ""}
                          </dd>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Alterar: ${onBoardingQuestions[index].title}`}
                          onClick={() => goTo(index)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>
        </ViewTransition>

        <div className="mt-8 flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => goTo(step - 1)}>
              <ArrowLeft />
              Voltar
            </Button>
          ) : (
            <span />
          )}
          {step < LAST_STEP ? (
            <Button className="group" disabled={!answers[keys[step]]} onClick={() => goTo(step + 1)}>
              Próximo
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <Button className="group" disabled={isPending} onClick={submit}>
              {isPending ? "A guardar..." : "Começar a explorar"}
              {!isPending && <ArrowRight className="transition-transform group-hover:translate-x-0.5" />}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 px-1 text-center">
        <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Feito em Cabo Verde.</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
          Descobre, partilha e apoia os projetos e produtos digitais criados por cabo-verdianos.
        </p>
      </div>
    </div>
  );
}

function OptionCard({
  name,
  value,
  checked,
  icon,
  onSelect,
  onPick,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  icon: ReactNode;
  onSelect: () => void;
  /** A pointer click, as opposed to arrow keys moving through the group. */
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-[background-color,border-color,transform] duration-150 select-none hover:bg-muted/50 active:scale-[0.98] has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 motion-reduce:active:scale-100",
        checked && "border-primary bg-primary-soft hover:bg-primary-soft",
      )}
      // Keyboard selection fires clicks with detail 0; only pointer clicks advance.
      onClick={(event) => event.detail > 0 && onPick()}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
          checked && "bg-background text-primary",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 font-medium">{children}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked && "border-primary bg-primary text-primary-foreground",
        )}
      >
        {checked && <Check className="size-3 animate-in zoom-in-0 duration-200" strokeWidth={3} />}
      </span>
    </label>
  );
}
