import { useForm, UseFormReturnType } from "@mantine/form";
import { useCounter } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { createContext, PropsWithChildren, useRef } from "react";

import { useNavigate } from "@tanstack/react-router";
import {
  createProjectSchema,
  toCreateProjectPayload,
  useCreateProject,
} from "../hooks/use-create-project";
import { usePublishProject } from "@/modules/releases/hooks/use-project-actions";
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
    "island",
  ],
];

const stepValidatedFieldNames: (keyof CreateProjectInput)[][] = [
  [
    ...stepFieldNames[0],
    "githubUrl",
    "description",
    "logoUrl",
    "bannerImageUrl",
  ],
  stepFieldNames[1],
];

type SumbmitContextType = {
  form: UseFormReturnType<CreateProjectInput>;
  active: number;
  isFist: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
  /** Saves without publishing; the project stays private to the maker. */
  saveDraft: () => void;
  /** Saves and puts the project into this week's ranking straight away. */
  publish: () => void;
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
  logoUrl: undefined,
  bannerImageUrl: undefined,
  pricing: "",
  platform: [],
  businessModel: "",
  access: "",
  projectStage: "",
  audienceStage: "",
  island: "",
  categoryId: "",
};

function SumbmitProvider({ children }: PropsWithChildren) {
  const min = 0;
  const max = 2;
  const [step, handlers] = useCounter(0, { min, max });
  const navigate = useNavigate();

  // "Publicar" is create-then-publish: the API always creates a draft, so the
  // one-click path chains the publish call rather than needing its own endpoint.
  // A ref, not state — `save()` fires the mutation in the same tick it records
  // the intent, so a state update would still be the previous value by then.
  const publishAfterCreate = useRef(false);

  const { publishProject, isPending: isPublishing } = usePublishProject({
    onSuccess: () => {
      navigate({ to: "/dashboard/releases" });
    },
  });

  const { createProject, isPending: isCreating } = useCreateProject({
    errorMessage: "Não foi possível guardar o projeto",
    onSuccess: (created) => {
      if (publishAfterCreate.current) {
        // The publish mutation announces the launch itself.
        publishProject(created.data.id);
        return;
      }

      notifications.show({
        title: "Tudo certo!",
        message: "Rascunho guardado. Publica quando estiveres pronto.",
        icon: <IconCheck />,
        color: "teal",
      });
      navigate({ to: "/dashboard/releases" });
    },
  });

  const isPending = isCreating || isPublishing;

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

  function save(shouldPublish: boolean) {
    const result = form.validate();
    if (result.hasErrors) return;

    publishAfterCreate.current = shouldPublish;
    createProject(toCreateProjectPayload(form.values));
  }

  const value = {
    form,
    active: step,
    isFist: step === min,
    isLast: step === max,
    next,
    previous: handlers.decrement,
    saveDraft: () => save(false),
    publish: () => save(true),
    canProceed,
    isPending,
  };

  return (
    <SumbmitContext.Provider value={value}>{children}</SumbmitContext.Provider>
  );
}

export default SumbmitProvider;
