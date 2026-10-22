import { Button } from "@/components/ui/button";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useEffect, useState } from "react";
import { onBoardingQuestions } from "../../questions";
import {
  type MakerPreferences,
  usePreferences,
  useUpdatePreferences,
} from "../../hooks/use-preferences";
import {
  DiasporaCountryField,
  ResponseOption,
} from "../response-option/response-option";

const keys = [
  "profileResponse",
  "objectiveResponse",
  "locationResponse",
  "foundUsByResponse",
] as const satisfies readonly (keyof MakerPreferences)[];

const isSame = (a: MakerPreferences, b: MakerPreferences) =>
  keys.every((key) => a[key] === b[key]) &&
  (a.diasporaCountry ?? "") === (b.diasporaCountry ?? "");

export function PreferencesForm() {
  const { data, isLoading, isError } = usePreferences();
  const showLoading = useDelayedLoading(isLoading);
  const [answers, setAnswers] = useState<MakerPreferences | null>(null);
  const [editingDiasporaCountry, setEditingDiasporaCountry] = useState(false);
  const { updatePreferences, isPending } = useUpdatePreferences();

  useEffect(() => {
    if (data) {
      setAnswers(data);
      setEditingDiasporaCountry(data.locationResponse === "diaspora");
    }
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
      <p className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar as preferências.
      </p>
    );

  const changed = !isSame(answers, data);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        updatePreferences(answers);
      }}
    >
      {onBoardingQuestions.map((question, index) => {
        const key = keys[index];
        const showDiaspora = key === "locationResponse" && editingDiasporaCountry;
        return (
          <fieldset key={key} className="rounded-xl border bg-card p-4 sm:p-5">
            <legend className="sr-only">{question.title}</legend>
            <h3 aria-hidden="true" className="mb-4 text-[15px] font-semibold leading-5">
              {question.title}
            </h3>
            {showDiaspora ? (
              <DiasporaCountryField
                value={answers.diasporaCountry ?? ""}
                onChange={(country) =>
                  setAnswers({ ...answers, diasporaCountry: country || undefined })
                }
                onBack={() => {
                  setEditingDiasporaCountry(false);
                  setAnswers({ ...answers, diasporaCountry: undefined });
                }}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {question.reponses.map((response) => (
                  <ResponseOption
                    key={response.value}
                    name={key}
                    value={response.value}
                    checked={answers[key] === response.value}
                    onSelect={() => {
                      if (key === "locationResponse" && response.value === "diaspora") {
                        setEditingDiasporaCountry(true);
                      }
                      setAnswers({
                        ...answers,
                        [key]: response.value,
                        ...(key === "locationResponse" ? { diasporaCountry: undefined } : {}),
                      } as MakerPreferences);
                    }}
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
            onClick={() => {
              setAnswers(data);
              setEditingDiasporaCountry(data.locationResponse === "diaspora");
            }}
          >
            Descartar
          </Button>
        )}
        <Button type="submit" disabled={isPending || !changed}>
          {isPending ? "A guardar..." : "Guardar preferências"}
        </Button>
      </div>
    </form>
  );
}
