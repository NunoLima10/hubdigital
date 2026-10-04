import { Button } from "@/components/ui/button";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useEffect, useState } from "react";
import { onBoardingQuestions } from "../../questions";
import {
  diasporaCountryLabels,
  diasporaCountryValues,
} from "../../questions";
import {
  type MakerPreferences,
  usePreferences,
  useUpdatePreferences,
} from "../../hooks/use-preferences";

const keys = [
  "profileResponse",
  "objectiveResponse",
  "locationResponse",
  "foundUsByResponse",
] as const satisfies readonly (keyof MakerPreferences)[];

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
      <div className="grid gap-4 sm:grid-cols-2" aria-label="A carregar preferências">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-52 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    ) : null;

  if (isError || !answers)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar as preferências.
      </p>
    );

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        updatePreferences(answers);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {onBoardingQuestions.map((question, index) => {
          const key = keys[index];
          return (
            <fieldset key={key} className="rounded-lg border bg-card p-4">
              <legend className="px-1 text-[15px] font-semibold leading-5">
                {question.title}
              </legend>
              <div className="mt-3 space-y-2">
                {(key === "locationResponse" && editingDiasporaCountry
                  ? []
                  : question.reponses
                ).map((response) => (
                  <label
                    key={response.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm hover:bg-muted/50 ${answers[key] === response.value ? "border-primary bg-primary/5" : ""}`}
                  >
                    <input
                      type="radio"
                      name={key}
                      value={response.value}
                      checked={answers[key] === response.value}
                      onChange={() => {
                        if (key === "locationResponse" && response.value === "diaspora") {
                          setEditingDiasporaCountry(true);
                        }
                        setAnswers((current) =>
                          current
                            ? ({
                                ...current,
                                [key]: response.value,
                                ...(key === "locationResponse"
                                  ? { diasporaCountry: undefined }
                                  : {}),
                              } as MakerPreferences)
                            : current,
                        );
                      }}
                      className="accent-primary"
                    />
                    {response.display}
                  </label>
                ))}
                {key === "locationResponse" && editingDiasporaCountry && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Em que país? <span className="font-normal text-muted-foreground">(opcional)</span>
                      </p>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          setEditingDiasporaCountry(false);
                          setAnswers((current) =>
                            current
                              ? { ...current, diasporaCountry: undefined }
                              : current,
                          );
                        }}
                      >
                        Voltar às ilhas
                      </button>
                    </div>
                    {diasporaCountryValues.map((country) => (
                      <label
                        key={country}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm hover:bg-muted/50 ${answers.diasporaCountry === country ? "border-primary bg-primary/5" : ""}`}
                      >
                        <input
                          type="radio"
                          name="diasporaCountry"
                          value={country}
                          checked={answers.diasporaCountry === country}
                          onChange={() =>
                            setAnswers((current) =>
                              current ? { ...current, diasporaCountry: country } : current,
                            )
                          }
                          className="accent-primary"
                        />
                        {diasporaCountryLabels[country]}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "A guardar..." : "Guardar preferências"}
        </Button>
      </div>
    </form>
  );
}
