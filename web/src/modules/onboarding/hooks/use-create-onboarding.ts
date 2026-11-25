import { API } from "@/api/api";
import { CreateOptions } from "@/types";
import {
  islandValues,
  objectiveResponsesSchema,
  profileResponsesSchema,
  type BadgeKey,
} from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import {
  diasporaCountryValues,
  foundUsByQuestionValues,
  locationQuestionValues,
} from "../questions";

const schema = z.object({
  bio: z.string(),
  profileResponses: profileResponsesSchema,
  objectiveResponses: objectiveResponsesSchema,
  locationResponse: z.enum(locationQuestionValues),
  diasporaCountry: z.enum(diasporaCountryValues).optional(),
  // Asked only from the diaspora, where it is required.
  originIsland: z.enum(islandValues).optional(),
  foundUsByResponse: z.enum(foundUsByQuestionValues),
}).refine(
  (answers) => answers.locationResponse !== "diaspora" || answers.originIsland,
  { message: "Escolhe a tua ilha de origem.", path: ["originIsland"] },
);

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
