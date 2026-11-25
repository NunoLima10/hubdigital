import { Button } from "@/components/ui/button";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { islandLabels } from "@hubdigital/shared";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import {
  diasporaCountryLabels,
  objectiveQuestionValues,
  onBoardingQuestions,
  profileQuestionValues,
} from "../../questions";
import {
  type MakerPreferences,
  usePreferences,
  useUpdatePreferences,
} from "../../hooks/use-preferences";
import {
  DiasporaFields,
  LocationOptions,
  ResponseOption,
} from "../response-option/response-option";

const keys = [
  "profileResponses",
  "objectiveResponses",
  "locationResponse",
  "foundUsByResponse",
] as const satisfies readonly (keyof MakerPreferences)[];
type Key = (typeof keys)[number];

/** While editing, "Voltar às ilhas" leaves the location empty until one is picked. */
type Draft = Omit<MakerPreferences, "locationResponse"> & {
  locationResponse: MakerPreferences["locationResponse"] | "";
};

/** The picked values, whether the question takes one answer or several. */
const valuesOf = (answer: string | readonly string[]) =>
  typeof answer === "string" ? (answer ? [answer] : []) : answer;

/** Whether this question still needs an answer before saving. */
const isMissing = (key: Key, draft: Draft) =>
  valuesOf(draft[key]).length === 0 ||
  (key === "locationResponse" && draft.locationResponse === "diaspora" && !draft.originIsland);

/** The answer on one line, like the summary at the end of onboarding. */
function summarize(key: Key, draft: Draft) {
  const values = valuesOf(draft[key]);
  const parts = [
    onBoardingQuestions[keys.indexOf(key)].reponses
      .filter((response) => values.includes(response.value))
      .map((response) => response.display)
      .join(", "),
  ];
  if (key === "locationResponse" && draft.locationResponse === "diaspora") {
    if (draft.diasporaCountry) parts.push(diasporaCountryLabels[draft.diasporaCountry]);
    parts.push(
      draft.originIsland ? `de ${islandLabels[draft.originIsland]}` : "falta a ilha de origem",
    );
  }
  return parts.filter(Boolean).join(" · ");
}

const isSame = (a: Draft, b: Draft) =>
  keys.every((key) => valuesOf(a[key]).join() === valuesOf(b[key]).join()) &&
  (a.diasporaCountry ?? "") === (b.diasporaCountry ?? "") &&
  (a.originIsland ?? "") === (b.originIsland ?? "");

/** Every question answered, and the island of origin when abroad. */
const isComplete = (draft: Draft): draft is MakerPreferences =>
  draft.profileResponses.length > 0 &&
  draft.objectiveResponses.length > 0 &&
  draft.locationResponse !== "" &&
  (draft.locationResponse !== "diaspora" || Boolean(draft.originIsland));

/** Adds or removes an answer from a list, keeping the question's order. */
function toggle<T extends string>(order: readonly T[], current: readonly T[], value: string) {
  return order.filter((item) =>
    item === value ? !current.includes(item) : current.includes(item),
  );
}

export function PreferencesForm() {
  const { data, isLoading, isError, refetch } = usePreferences();
  const showLoading = useDelayedLoading(isLoading);
  const [answers, setAnswers] = useState<Draft | null>(null);
  const { updatePreferences, isPending } = useUpdatePreferences();
  // On a phone the four questions make one very long page, so each shows its
  // answer and only the one being changed opens.
  const compact = useMediaQuery("(max-width: 639px)");
  const [open, setOpen] = useState<Key | null>(null);

  useEffect(() => {
    if (data) setAnswers(data);
  }, [data]);

  if (isLoading)
    return showLoading ? (
      <div className="space-y-4" aria-label="A carregar preferências">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    ) : null;

  if (isError || !answers || !data)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div>
          <h2 className="font-semibold">
            Não foi possível carregar as preferências
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma alteração foi feita.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    );

  const changed = !isSame(answers, data);

  function select(key: Key, value: string) {
    if (!answers) return;
    if (key === "profileResponses") {
      setAnswers({
        ...answers,
        profileResponses: toggle(profileQuestionValues, answers.profileResponses, value),
      });
    } else if (key === "objectiveResponses") {
      setAnswers({
        ...answers,
        objectiveResponses: toggle(objectiveQuestionValues, answers.objectiveResponses, value),
      });
    } else if (key === "locationResponse") {
      // Picking a place starts the diaspora details over.
      setAnswers({
        ...answers,
        locationResponse: value as Draft["locationResponse"],
        diasporaCountry: undefined,
        originIsland: undefined,
      });
    } else {
      setAnswers({ ...answers, [key]: value } as Draft);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isComplete(answers)) return;
        setOpen(null);
        updatePreferences(answers);
      }}
    >
      {onBoardingQuestions.map((question, index) => {
        const key = keys[index];
        const collapsed = compact && open !== key;
        return (
          <fieldset
            key={key}
            aria-describedby={!collapsed && question.hint ? `${key}-hint` : undefined}
            className="rounded-xl border bg-card p-4 sm:p-5"
          >
            <legend className="sr-only">{question.title}</legend>
            <div className={cn("flex items-start gap-3", !collapsed && "mb-4")}>
              <div className="min-w-0 flex-1">
                <h3 aria-hidden="true" className="text-[15px] font-semibold leading-5">
                  {question.title}
                </h3>
                {collapsed ? (
                  <p
                    className={cn(
                      "mt-1 text-sm text-pretty",
                      isMissing(key, answers) ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {summarize(key, answers) || "Falta responder"}
                  </p>
                ) : (
                  question.hint && (
                    <p id={`${key}-hint`} className="mt-1 text-sm text-muted-foreground">
                      {question.hint}
                    </p>
                  )
                )}
              </div>
              {compact && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-my-1 shrink-0"
                  aria-expanded={!collapsed}
                  aria-label={`${collapsed ? "Alterar" : "Fechar"}: ${question.title}`}
                  onClick={() => setOpen(collapsed ? key : null)}
                >
                  {collapsed && <Pencil />}
                  {collapsed ? "Alterar" : "Fechar"}
                </Button>
              )}
            </div>
            {collapsed ? null : key === "locationResponse" &&
              answers.locationResponse === "diaspora" ? (
              <DiasporaFields
                country={answers.diasporaCountry ?? ""}
                onCountryChange={(country) =>
                  setAnswers({ ...answers, diasporaCountry: country || undefined })
                }
                originIsland={answers.originIsland ?? ""}
                onOriginIslandChange={(island) =>
                  setAnswers({ ...answers, originIsland: island })
                }
                onBack={() => select("locationResponse", "")}
              />
            ) : key === "locationResponse" ? (
              <LocationOptions
                name={key}
                options={question.reponses}
                value={answers.locationResponse}
                onSelect={(value) => select(key, value)}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {question.reponses.map((response) => (
                  <ResponseOption
                    key={response.value}
                    name={key}
                    value={response.value}
                    multiple={question.multiple}
                    checked={valuesOf(answers[key]).includes(response.value)}
                    onSelect={() => select(key, response.value)}
                  >
                    {response.display}
                  </ResponseOption>
                ))}
              </div>
            )}
          </fieldset>
        );
      })}
      <div className="flex items-center justify-end gap-2">
        {changed && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => setAnswers(data)}
          >
            Descartar
          </Button>
        )}
        <Button type="submit" disabled={isPending || !changed || !isComplete(answers)}>
          {isPending ? "A guardar..." : "Guardar preferências"}
        </Button>
      </div>
    </form>
  );
}
