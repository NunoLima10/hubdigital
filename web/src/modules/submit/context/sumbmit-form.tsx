import { useForm, UseFormReturnType } from "@mantine/form";
import { useCounter } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import { createContext, PropsWithChildren } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  createProjectSchema,
  toCreateProjectPayload,
  useCreateProject,
} from "../hooks/use-create-project";
import { CreateProjectInput } from "../types/project";

const stepFieldNames: (keyof CreateProjectInput)[][] = [
  ["name", "shortDescription", "websiteUrl"],
  [
    "projectStage",
    "platform",
    "audienceStage",
    "businessModel",
    "access",
    "categoryId",
    "pricing",
  ],
];

const stepValidatedFieldNames: (keyof CreateProjectInput)[][] = [
  [...stepFieldNames[0], "githubUrl", "description"],
  stepFieldNames[1],
];

type SumbmitContextType = {
  form: UseFormReturnType<CreateProjectInput>;
  active: number;
  isFist: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
  submit: () => void;
  canProceed: boolean;
  isPending: boolean;
};

export const SumbmitContext = createContext<SumbmitContextType | undefined>(
  undefined
);

const initialValues: CreateProjectInput = {
  name: "",
  shortDescription: "",
  description: "",
  websiteUrl: "",
  githubUrl: "",
  pricing: "",
  platform: [],
  businessModel: "",
  access: "",
  projectStage: "",
  audienceStage: "",
  categoryId: "",
};

function SumbmitProvider({ children }: PropsWithChildren) {
  const min = 0;
  const max = 2;
  const [step, handlers] = useCounter(0, { min, max });
  const navigate = useNavigate();

  const { createProject, isPending } = useCreateProject({
    successMessage: "Projeto publicado com sucesso!",
    errorMessage: "Não foi possível publicar o projeto",
    onSuccess: () => {
      navigate({ to: "/dashboard/releases" });
    },
  });

  const form = useForm<CreateProjectInput>({
    initialValues,
    validate: zodResolver(createProjectSchema),
  });

  const currentStepFields = stepFieldNames[step] ?? [];
  const currentStepValidatedFields =
    stepValidatedFieldNames[step] ?? currentStepFields;
  const canProceed = currentStepFields.every((field) => {
    const value = form.values[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== undefined && value !== null;
  });

  function next() {
    if (!canProceed) return;

    const result = form.validate();

    (Object.keys(initialValues) as (keyof CreateProjectInput)[])
      .filter((field) => !currentStepValidatedFields.includes(field))
      .forEach((field) => form.clearFieldError(field));

    const stepHasErrors = currentStepValidatedFields.some(
      (field) => result.errors[field]
    );
    if (stepHasErrors) return;

    handlers.increment();
  }

  function submit() {
    const result = form.validate();
    if (result.hasErrors) return;

    createProject(toCreateProjectPayload(form.values));
  }

  const value = {
    form,
    active: step,
    isFist: step === min,
    isLast: step === max,
    next,
    previous: handlers.decrement,
    submit,
    canProceed,
    isPending,
  };

  return (
    <SumbmitContext.Provider value={value}>{children}</SumbmitContext.Provider>
  );
}

export default SumbmitProvider;
