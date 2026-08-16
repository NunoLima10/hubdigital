import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import type { ProjectBody } from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "../options";
import { CreateProjectInput } from "../types/project";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Informe o nome do projeto")
    .max(120, "Nome muito longo"),
  shortDescription: z
    .string()
    .min(10, "A descrição curta deve ter pelo menos 10 caracteres")
    .max(200, "A descrição curta deve ter no máximo 200 caracteres"),
  description: z.string().max(20000).optional(),
  websiteUrl: z.string().url("Informe um website válido"),
  githubUrl: z
    .string()
    .url("Informe um link válido")
    .optional()
    .or(z.literal("")),
  pricing: z.enum(pricingValues, {
    errorMap: () => ({ message: "Selecione o modelo de preço" }),
  }),
  platform: z
    .array(z.enum(platformValues))
    .min(1, "Selecione pelo menos uma plataforma"),
  businessModel: z.enum(businessModelValues, {
    errorMap: () => ({ message: "Selecione o modelo de negócio" }),
  }),
  access: z.enum(accessValues, {
    errorMap: () => ({ message: "Selecione o tipo de acesso" }),
  }),
  projectStage: z.enum(projectStageValues, {
    errorMap: () => ({ message: "Selecione a maturidade do projeto" }),
  }),
  audienceStage: z.enum(audienceValues, {
    errorMap: () => ({ message: "Selecione o público-alvo" }),
  }),
  categoryId: z.number({
    invalid_type_error: "Selecione uma categoria",
  }),
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
