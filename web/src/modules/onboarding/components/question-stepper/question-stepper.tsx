import { maxOnboardingChoices } from "@hubdigital/shared";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag/country-flag";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { addTransitionType, startTransition, useState, ViewTransition } from "react";
import { toast } from "sonner";
import { islandLabels, type Island } from "@hubdigital/shared";
import { diasporaCountryLabels, onBoardingQuestions } from "../../questions";
import {
  DiasporaFields,
  LocationOptions,
  ResponseIcon,
  ResponseOption,
  type DiasporaCountry,
} from "../response-option/response-option";
import {
  useCreateOnboarding,
  type OnboardingResponse,
} from "../../hooks/use-create-onboarding";
import type { OnboardingResult } from "../onboarding-success/onboarding-success";

const keys = [
  "profileResponses",
  "objectiveResponses",
  "locationResponse",
  "foundUsByResponse",
] as const;
type AnswerKey = (typeof keys)[number];
type Answers = {
  profileResponses: string[];
  objectiveResponses: string[];
  locationResponse: string;
  foundUsByResponse: string;
};
const LAST_STEP = keys.length;

/** The picked values, whether the question takes one answer or several. */
const valuesOf = (answer: string | string[]) => (Array.isArray(answer) ? answer : answer ? [answer] : []);

export function QuestionStepper({ onComplete }: { onComplete: (result: OnboardingResult) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    profileResponses: [],
    objectiveResponses: [],
    locationResponse: "",
    foundUsByResponse: "",
  });
  const [diasporaCountry, setDiasporaCountry] = useState<DiasporaCountry | "">("");
  const [originIsland, setOriginIsland] = useState<Island | "">("");
  const answered = (key: AnswerKey) =>
    valuesOf(answers[key]).length > 0;
  const { createOnboarding, schema, isPending } = useCreateOnboarding({
    onSuccess: (response) =>
      onComplete({
        ...answers,
        membershipNumber: response.data.membershipNumber,
        badges: response.data.badges,
      }),
  });
  const question = onBoardingQuestions[step];
  const showDiaspora = step === 2 && answers.locationResponse === "diaspora";

  function goTo(next: number) {
    startTransition(() => {
      addTransitionType(next > step ? "onboarding-forward" : "onboarding-backward");
      setStep(next);
    });
  }

  function choose(value: string) {
    const key = keys[step];
    setAnswers((current) => {
      const answer = current[key];
      if (!Array.isArray(answer)) return { ...current, [key]: value };
      const picked = answer.includes(value)
        ? answer.filter((item) => item !== value)
        : [...answer, value];
      // Kept in the question's order, whatever order they were clicked in.
      const ordered = question.reponses
        .map((response) => response.value)
        .filter((item) => picked.includes(item));
      return { ...current, [key]: ordered };
    });
    if (step === 2 && value !== "diaspora") {
      setDiasporaCountry("");
      setOriginIsland("");
    }
  }

  function submit() {
    const parsed = schema.safeParse({
      bio: "",
      ...answers,
      diasporaCountry: diasporaCountry || undefined,
      originIsland: originIsland || undefined,
    });
    if (!parsed.success) {
      toast.error("Escolhe uma opção em cada passo.");
      return;
    }
    createOnboarding(parsed.data as OnboardingResponse);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 px-1 text-center">
        <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">Feito em Cabo Verde.</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
          Descobre, partilha e apoia os projetos e produtos digitais criados por cabo-verdianos.
        </p>
      </div>
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
                    index < step || (index === step && answered(key)) ? "scale-x-100" : "scale-x-0",
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
              <fieldset
                aria-describedby={question.hint ? `${keys[step]}-hint` : undefined}
                // Enter on a chosen option acts like Próximo. Only the options
                // count: Enter in the country search picks a country instead.
                onKeyDown={(event) => {
                  const target = event.target as HTMLInputElement;
                  const isOption = target.type === "radio" || target.type === "checkbox";
                  if (event.key !== "Enter" || !isOption || !answered(keys[step])) return;
                  event.preventDefault();
                  goTo(step + 1);
                }}
              >
                <legend className="text-2xl font-semibold tracking-tight text-balance">
                  {question.title}
                </legend>
                {question.hint && (
                  <p id={`${keys[step]}-hint`} className="mt-1.5 text-sm text-muted-foreground">
                    {question.hint}
                  </p>
                )}
                {showDiaspora ? (
                  <div className="mt-6">
                    <DiasporaFields
                      country={diasporaCountry}
                      onCountryChange={setDiasporaCountry}
                      originIsland={originIsland}
                      onOriginIslandChange={setOriginIsland}
                      onBack={() => choose("")}
                    />
                  </div>
                ) : keys[step] === "locationResponse" ? (
                  <div className="mt-6">
                    <LocationOptions
                      name={keys[step]}
                      options={question.reponses}
                      value={answers.locationResponse}
                      onSelect={choose}
                    />
                  </div>
                ) : (
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {question.reponses.map((response) => (
                      <ResponseOption
                        key={response.value}
                        name={keys[step]}
                        value={response.value}
                        multiple={question.multiple}
                        disabled={question.multiple && valuesOf(answers[keys[step]]).length >= maxOnboardingChoices && !valuesOf(answers[keys[step]]).includes(response.value)}
                        checked={valuesOf(answers[keys[step]]).includes(response.value)}
                        onSelect={() => choose(response.value)}
                      >
                        {response.display}
                      </ResponseOption>
                    ))}
                  </div>
                )}
              </fieldset>
            ) : (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Tudo pronto!</h1>
                <dl className="mt-6 divide-y rounded-xl border">
                  {keys.map((key, index) => {
                    const values = valuesOf(answers[key]);
                    const display = onBoardingQuestions[index].reponses
                      .filter((response) => values.includes(response.value))
                      .map((response) => response.display)
                      .join(", ");
                    return (
                      <div key={key} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          {key === "locationResponse" && diasporaCountry ? (
                            <CountryFlag country={diasporaCountry} className="text-lg" />
                          ) : (
                            <ResponseIcon value={values[0] ?? ""} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <dt className="text-xs text-muted-foreground">
                            {onBoardingQuestions[index].title}
                          </dt>
                          <dd className="text-sm font-medium text-pretty">
                            {display}
                            {key === "locationResponse" && diasporaCountry
                              ? ` · ${diasporaCountryLabels[diasporaCountry]}`
                              : ""}
                            {key === "locationResponse" && originIsland
                              ? ` · de ${islandLabels[originIsland]}`
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
            <Button className="group" disabled={!answered(keys[step])} onClick={() => goTo(step + 1)}>
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

    </div>
  );
}

