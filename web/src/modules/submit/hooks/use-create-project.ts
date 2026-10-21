import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import {
  projectPublicationSchema,
  type ProjectBody,
} from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import { CreateProjectInput } from "../types/project";
import { draftPayloadFromForm } from "../utils/draft";

export const createProjectSchema = z.preprocess(
  (value) => draftPayloadFromForm(value as CreateProjectInput), projectPublicationSchema,
);
export type CreateProjectPayload = ProjectBody;
type CreateProjectResponse = { id: number; slug: string };
export function toCreateProjectPayload(values: CreateProjectInput): CreateProjectPayload {
  return projectPublicationSchema.parse(draftPayloadFromForm(values));
}

async function postProject(payload: CreateProjectPayload) {
  const response = await API.post<ItemResponse<CreateProjectResponse>>(
    "/projects",
    payload
  );
  return response.data;
}

export function useCreateProject(
  options?: CreateOptions<ItemResponse<CreateProjectResponse>>
) {
  const { mutate, isPending } = useMutation<
    ItemResponse<CreateProjectResponse>,
    AxiosError<{ error: { message: string } }>,
    CreateProjectPayload
  >({
    mutationFn: postProject,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    meta: {
      errorMessage: options?.errorMessage ?? "Erro ao publicar o projeto",
      successMessage: options?.successMessage,
      invalidatesQuery: ["my-projects"],
    },
  });

  return { createProject: mutate, schema: createProjectSchema, isPending };
}
