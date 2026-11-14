import { API } from "@/api/api";
import { CreateOptions } from "@/types";
import type { BadgeKey } from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import {
  diasporaCountryValues,
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "../questions";

const schema = z.object({
  bio: z.string(),
  profileResponse: z.enum(profileQuestionValues),
  objectiveResponse: z.enum(objectiveQuestionValues),
  locationResponse: z.enum(locationQuestionValues),
  diasporaCountry: z.enum(diasporaCountryValues).optional(),
  foundUsByResponse: z.enum(foundUsByQuestionValues),
});

export type OnboardingResponse = z.infer<typeof schema>;

export type OnboardingCreated = {
  data: {
    id: number;
    membershipNumber: number;
    /** Badges earned by joining, revealed on the welcome screen. */
    badges: BadgeKey[];
  };
};

async function postOnboarding(responses: OnboardingResponse) {
  const response = await API.post<OnboardingCreated>("/users/onboarding", responses);
  return response.data;
}

export function useCreateOnboarding(options?: CreateOptions<OnboardingCreated>) {
  const { mutate, isPending } = useMutation<
    OnboardingCreated,
    AxiosError,
    OnboardingResponse
  >({
    mutationFn: postOnboarding,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    meta: {
      errorMessage: options?.errorMessage ?? "Erro ao enviar onboarding",
    },
  });

  return { createOnboarding: mutate, schema, isPending };
}
