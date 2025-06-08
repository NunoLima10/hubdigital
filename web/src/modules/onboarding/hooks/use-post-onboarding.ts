import { API } from "@/api/api";
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
  const response = await API.post<void>("/users/onboarding", responses);
  //   return response.data;
}

export function usePostOnboarding() {
  const { mutate, isPending } = useMutation<
    void,
    AxiosError,
    OnboardingResponse
  >({
    mutationFn: postOnboarding,
    onSuccess: () => {},
    onError: (error) => {},
  });

  return { postResponses: mutate, schema, isPending };
}
