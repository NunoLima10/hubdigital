import { API } from "@/api/api";
import { CreateOptions, PostResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import {
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
  foundUsByResponse: z.enum(foundUsByQuestionValues),
});

export type OnboardingResponse = z.infer<typeof schema>;

async function postOnboarding(responses: OnboardingResponse) {
  const response = await API.post<PostResponse>("/users/onboarding", responses);
  return response.data;
}

export function useCreateOnboarding(options?: CreateOptions) {
  const { mutate, isPending } = useMutation<
    PostResponse,
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
