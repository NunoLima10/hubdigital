import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { onBoardingQuestions } from "../../questions";
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

export function QuestionStepper() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    profileResponse: "",
    objectiveResponse: "",
    locationResponse: "",
    foundUsByResponse: "",
  });
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
  function submit() {
    const parsed = schema.safeParse({ bio: "", ...answers });
    if (!parsed.success) {
      toast.error("Escolhe uma opção em cada passo.");
      return;
    }
    createOnboarding(parsed.data as OnboardingResponse);
  }
  return (
    <div className="mx-auto w-full max-w-2xl space-y-7 rounded-xl border bg-card p-5 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Começar no HubDigital
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {step === 4 ? "Seja bem-vindo!" : question.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 4
            ? "Agora podes descobrir, partilhar e apoiar projetos feitos por cabo-verdianos."
            : `Passo ${step + 1} de 4`}
        </p>
      </div>
      <div
        className="flex gap-1"
        aria-label={`Passo ${Math.min(step + 1, 4)} de 4`}
      >
        {keys.map((key, index) => (
          <span
            key={key}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      {step < 4 ? (
        <fieldset className="space-y-2">
          <legend className="sr-only">{question.title}</legend>
          {question.reponses.map((response) => (
            <label
              key={response.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted/50 ${answers[keys[step]] === response.value ? "border-primary bg-primary/5" : ""}`}
            >
              <input
                type="radio"
                name={keys[step]}
                value={response.value}
                checked={answers[keys[step]] === response.value}
                onChange={() =>
                  setAnswers((current) => ({
                    ...current,
                    [keys[step]]: response.value,
                  }))
                }
                className="accent-primary"
              />
              {response.display}
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="text-sm leading-7">
          Completa o teu perfil e entra na comunidade de produtos digitais de
          Cabo Verde.
        </p>
      )}
      <div className="flex justify-end gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Voltar
          </Button>
        )}
        {step < 4 ? (
          <Button
            disabled={!answers[keys[step]]}
            onClick={() => setStep(step + 1)}
          >
            Próximo
          </Button>
        ) : (
          <Button disabled={isPending} onClick={submit}>
            {isPending ? "A guardar..." : "Entrar no HubDigital"}
          </Button>
        )}
      </div>
    </div>
  );
}
