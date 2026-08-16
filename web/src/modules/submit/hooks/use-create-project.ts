import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import { projectBodySchema, type ProjectBody } from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import { CreateProjectInput } from "../types/project";

// Reuses the shared API contract schema so field rules (lengths, enum
// values, required-ness) can't drift between web and api. Only the two
// fields where the Mantine form's raw values diverge from the wire
// payload shape are overridden.
export const createProjectSchema = projectBodySchema.extend({
  githubUrl: z
    .string()
    .url("Informe um link válido")
    .optional()
    .or(z.literal("")),
  categoryId: z
    .number({ invalid_type_error: "Selecione uma categoria" })
    .int()
    .positive(),
});

export type CreateProjectPayload = ProjectBody;

type CreateProjectResponse = { id: number; slug: string };

export function toCreateProjectPayload(
  values: CreateProjectInput
): CreateProjectPayload {
  const { categoryId, githubUrl, description, ...rest } = values;

  return {
    ...rest,
    categoryId: Number(categoryId),
    githubUrl: githubUrl || undefined,
    description: description || undefined,
  } as CreateProjectPayload;
}

async function postProject(payload: CreateProjectPayload) {
  const response = await API.post<ItemResponse<CreateProjectResponse>>(
    "/projects",
    payload
  );
  return response.data;
}

export function useCreateProject(options?: CreateOptions) {
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
