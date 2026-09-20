import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import {
  locationSchema,
  projectBodySchema,
  type ProjectBody,
  type ProjectLocation,
} from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { z } from "zod";
import { CreateProjectInput } from "../types/project";
import { locationFromFormValue, type LocationFormValue } from "../utils/location";

// Reuses the shared API contract schema so field rules (lengths, enum
// values, required-ness) can't drift between web and api. Only the fields
// where the Mantine form's raw values diverge from the wire payload shape
// are overridden.
export const createProjectSchema = projectBodySchema.extend({
  // The form keeps every level of the location as a flat, ""-defaulted object;
  // it is reshaped into the API's nested location before the shared rules run,
  // so the island-required / municipality-belongs-to-island checks are the same
  // ones the server applies.
  location: z.preprocess(
    // preprocess only knows the value as unknown; it is the form's location.
    (value) => locationFromFormValue(value as LocationFormValue),
    locationSchema
  ),
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
  const {
    categoryId,
    githubUrl,
    description,
    logoUrl,
    bannerImageUrl,
    location,
    ...rest
  } = values;

  return {
    ...rest,
    // Only called after the form validated, so this is a complete location.
    location: locationFromFormValue(location) as ProjectLocation,
    categoryId: Number(categoryId),
    githubUrl: githubUrl || undefined,
    description: description || undefined,
    // Passed through untouched: undefined keeps the saved image on a PATCH,
    // null clears it, a key sets a new one.
    logoUrl,
    bannerImageUrl,
  } as CreateProjectPayload;
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
