import { zodResolver } from "@hookform/resolvers/zod";
import {
  addTransitionType,
  createContext,
  startTransition,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { usePublishProject } from "@/modules/releases/hooks/use-project-actions";
import {
  createProjectSchema,
  toCreateProjectPayload,
  useCreateProject,
} from "../hooks/use-create-project";
import type { CreateProjectInput } from "../types/project";
import { emptyLocation, isLocationComplete } from "../utils/location";

const stepFields: (keyof CreateProjectInput)[][] = [
  [
    "name",
    "shortDescription",
    "websiteUrl",
    "githubUrl",
    "description",
    "logoUrl",
    "bannerImageUrl",
  ],
  [
    "projectStage",
    "platform",
    "audienceStage",
    "businessModel",
    "access",
    "categoryId",
    "pricing",
    "location",
  ],
];

type SubmitContextType = {
  form: UseFormReturn<CreateProjectInput>;
  active: number;
  isFist: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
  saveDraft: () => void;
  publish: () => void;
  canProceed: boolean;
  isPending: boolean;
};
export const SumbmitContext = createContext<SubmitContextType | undefined>(
  undefined,
);

export const initialProjectValues: CreateProjectInput = {
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
  location: emptyLocation,
  categoryId: "",
};

export default function SumbmitProvider({ children }: PropsWithChildren) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const publishAfterCreate = useRef(false);
  const form = useForm<CreateProjectInput>({
    defaultValues: initialProjectValues,
    resolver: zodResolver(createProjectSchema, undefined, {
      raw: true,
    }) as Resolver<CreateProjectInput>,
    mode: "onChange",
  });
  const values = form.watch();
  const { publishProject, isPending: isPublishing } = usePublishProject({
    onSuccess: () => navigate({ to: "/dashboard/releases" }),
  });
  const { createProject, isPending: isCreating } = useCreateProject({
    errorMessage: "Não foi possível guardar o projeto",
    onSuccess: (created) => {
      if (publishAfterCreate.current) {
        publishProject(created.data.id);
        return;
      }
      toast.success("Rascunho guardado. Publica quando estiveres pronto.");
      navigate({ to: "/dashboard/releases" });
    },
  });
  const isPending = isPublishing || isCreating;
  const required =
    step === 0
      ? (["name", "shortDescription", "websiteUrl"] as const)
      : step === 1
        ? stepFields[1]
        : [];
  const canProceed = required.every((field) => {
    const value = values[field];
    if (field === "location") return isLocationComplete(values.location);
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== undefined && value !== null;
  });
  async function next() {
    if (canProceed && (await form.trigger(stepFields[step]))) {
      startTransition(() => {
        addTransitionType("submit-forward");
        setStep((current) => Math.min(current + 1, 2));
      });
    }
  }
  function previous() {
    startTransition(() => {
      addTransitionType("submit-backward");
      setStep((current) => Math.max(current - 1, 0));
    });
  }
  function save(shouldPublish: boolean) {
    void form.handleSubmit((valid) => {
      publishAfterCreate.current = shouldPublish;
      createProject(toCreateProjectPayload(valid));
    })();
  }
  return (
    <SumbmitContext.Provider
      value={{
        form,
        active: step,
        isFist: step === 0,
        isLast: step === 2,
        next,
        previous,
        saveDraft: () => save(false),
        publish: () => save(true),
        canProceed,
        isPending,
      }}
    >
      {children}
    </SumbmitContext.Provider>
  );
}
