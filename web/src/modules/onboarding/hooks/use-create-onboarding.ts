import { orpcUtils } from "@/api/orpc";
import type { CreateOptions } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "../questions";

// Keep the local schema for form validation (mantine-form-zod-resolver)
const schema = z.object({
  bio: z.string(),
  profileResponse: z.enum(profileQuestionValues),
  objectiveResponse: z.enum(objectiveQuestionValues),
  locationResponse: z.enum(locationQuestionValues),
  foundUsByResponse: z.enum(foundUsByQuestionValues),
});

export type OnboardingResponse = z.infer<typeof schema>;

export function useCreateOnboarding(options?: CreateOptions) {
  const { mutate, isPending } = useMutation(
    orpcUtils.users.onboarding.mutationOptions({
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      meta: {
        errorMessage: options?.errorMessage ?? "Erro ao enviar onboarding",
      },
    })
  );

  return { createOnboarding: mutate, schema, isPending };
}
