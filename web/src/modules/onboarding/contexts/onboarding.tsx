import { useUser } from "@clerk/clerk-react";
import { useForm, UseFormReturnType } from "@mantine/form";
import { useCounter } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import { createContext, PropsWithChildren, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  OnboardingResponse,
  useCreateOnboarding,
} from "../hooks/use-create-onboarding";

type OnboardingContextType = {
  form: UseFormReturnType<OnboardingResponse>;
  active: number;
  isFist: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
  submit: () => void;
  isDispora: boolean;
  onSelectDispora: (e: React.ChangeEvent<HTMLInputElement>) => void;
  needSelection: boolean;
  isPending: boolean;
};

export const OnboardingContext = createContext<
  OnboardingContextType | undefined
>(undefined);

function OnboardingProvider({ children }: PropsWithChildren) {
  const min = 0;
  const max = 4;
  const [step, handlers] = useCounter(0, { min, max });
  const [isDispora, setIsDispora] = useState(false);

  const navigate = useNavigate();

  const { user } = useUser();
  const { createOnboarding, schema, isPending } = useCreateOnboarding({
    onSuccess: async () => {
      await user?.reload();
      navigate({ to: "/dashboard" });
    },
  });

  const form = useForm<OnboardingResponse>({
    validate: zodResolver(schema),
  });

  function onSelectDispora(e: React.ChangeEvent<HTMLInputElement>) {
    const liveInDispora = e.currentTarget.checked;
    setIsDispora(liveInDispora);

    if (liveInDispora) return form.setValues({ locationResponse: "diaspora" });
    form.setValues({ locationResponse: undefined });
  }

  const needSelection =
    (step === 0 && !!form.values.profileResponse) ||
    (step === 1 && !!form.values.objectiveResponse) ||
    (step === 2 && !!form.values.locationResponse) ||
    (step === 3 && !!form.values.foundUsByResponse);

  function submit() {
    createOnboarding(form.values);
  }

  const value = {
    form,
    active: step,
    isFist: step === min,
    isLast: step === max,
    next: handlers.increment,
    previous: handlers.decrement,
    submit,
    isDispora,
    onSelectDispora,
    needSelection,
    isPending,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export default OnboardingProvider;
