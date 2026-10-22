import { zodResolver } from "@hookform/resolvers/zod";
import {
  addTransitionType,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { celebrateLaunch } from "@/modules/releases/utils/launch-celebration";
import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import type { ItemResponse } from "@/types";
import { createProjectSchema } from "../hooks/use-create-project";
import type { CreateProjectInput, Project } from "../types/project";
import { draftRecoverySchema, projectToFormValues, toDraftPayload } from "../utils/draft";

const stepFields: (keyof CreateProjectInput)[][] = [
  [
    "name",
    "shortDescription",
    "links",
    "availability",
    "projectStage",
    "description",
    "logoKey",
    "galleryImageKeys",
    "youtubeVideoUrl",
  ],
  [
    "platform",
    "audiences",
    "businessModel",
    "sourceModel",
    "licenseId",
    "categoryId",
    "secondaryCategoryIds",
    "pricing",
    "languages",
    "helpWanted",
    "helpDescription",
    "teamDescription",
  ],
  ["location", "additionalLocations", "teamMode", "localConnections", "serviceArea"],
];
import { SumbmitContext, type SaveState, type Recovery } from "./submit-context";
import { initialProjectValues } from "./initial-project-values";
type SavedProject = { id: number; slug: string };
const requestOptions = { timeout: 15_000 };

export default function SumbmitProvider({
  children,
  project,
}: PropsWithChildren<{ project?: Project }>) {
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>(project ? "saved" : "unsaved");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const projectId = useRef<number | null>(project?.id ?? null);
  const creationKey = useRef<string>(globalThis.crypto.randomUUID());
  const activeSave = useRef<Promise<SavedProject> | null>(null);
  const publishing = useRef(false);
  const finished = useRef(false);
  const lastSaved = useRef(project ? JSON.stringify(projectToFormValues(project)) : "");
  const failedSignature = useRef<string | null>(null);
  const storageKey = session?.user.id
    ? `hd:submission:${session.user.id}:${project?.id ?? "new"}`
    : null;
  const form = useForm<CreateProjectInput>({
    defaultValues: project ? projectToFormValues(project) : initialProjectValues,
    resolver: zodResolver(createProjectSchema, undefined, {
      raw: true,
    }) as Resolver<CreateProjectInput>,
    mode: "onSubmit",
  });
  const values = form.watch();
  const signature = JSON.stringify(values);
  const canSave = Boolean(values.name.trim()) && !recovery;
  const hasWork = Boolean(projectId.current || signature !== JSON.stringify(initialProjectValues));

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const result = draftRecoverySchema.safeParse(JSON.parse(raw));
        if (result.success) setRecovery(result.data);
        else window.localStorage.removeItem(storageKey);
      }
    } catch {
      /* Server saving also works without browser storage. */
    }
    setRecoveryChecked(true);
  }, [storageKey]);
  useEffect(() => {
    if (!storageKey || !recoveryChecked || recovery || finished.current || !hasWork) return;
    if (project && signature === lastSaved.current) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* optional recovery */
      }
      return;
    }
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          values,
          step,
          projectId: projectId.current,
          creationKey: creationKey.current,
        }),
      );
    } catch {
      /* Never block saving because a local recovery copy failed. */
    }
  }, [storageKey, recoveryChecked, recovery, values, step, saveState, hasWork, project, signature]);

  const persist = useCallback(
    async (snapshot: CreateProjectInput) => {
      const payload = toDraftPayload(snapshot);
      if (!projectId.current) {
        const response = await API.post<ItemResponse<SavedProject>>(
          "/projects",
          {
            ...payload,
            creationKey: creationKey.current,
          },
          requestOptions,
        );
        projectId.current = response.data.data.id;
      }
      // A repeated creation key can return a previous successful request; PATCH
      // ensures the latest snapshot is saved even when its response was lost.
      const response = await API.patch<ItemResponse<SavedProject>>(
        `/projects/${projectId.current}`,
        payload,
        requestOptions,
      );
      lastSaved.current = JSON.stringify(snapshot);
      failedSignature.current = null;
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", response.data.data.slug] });
      return response.data.data;
    },
    [queryClient],
  );
  const save = useCallback(
    async (explicit: boolean) => {
      if (activeSave.current || publishing.current || !form.getValues("name").trim()) return;
      const snapshot = structuredClone(form.getValues());
      setIsSaving(true);
      setSaveState("saving");
      const request = persist(snapshot);
      activeSave.current = request;
      try {
        await request;
        setSaveState(JSON.stringify(form.getValues()) === lastSaved.current ? "saved" : "unsaved");
        if (explicit) toast.success("Rascunho guardado. Podes continuar mais tarde.");
      } catch {
        failedSignature.current = JSON.stringify(snapshot);
        setSaveState("error");
        if (explicit)
          toast.error("Não foi possível guardar. As alterações continuam neste formulário.");
      } finally {
        activeSave.current = null;
        setIsSaving(false);
      }
    },
    [form, persist],
  );
  useEffect(() => {
    if (!recoveryChecked || recovery || isSaving || isPublishing || !canSave || finished.current)
      return;
    if (signature === lastSaved.current || signature === failedSignature.current) return;
    const timeout = window.setTimeout(() => void save(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [signature, recoveryChecked, recovery, isSaving, isPublishing, canSave, save]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (hasWork && signature !== lastSaved.current && !finished.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasWork, signature]);

  function changeStep(next: number) {
    if (publishing.current || recovery) return;
    startTransition(() => {
      addTransitionType(next > step ? "submit-forward" : "submit-backward");
      setStep(Math.max(0, Math.min(next, 3)));
    });
  }
  async function publish() {
    if (publishing.current || recovery) return;
    // Claim publication before validation so double clicks cannot race with autosave.
    publishing.current = true;
    setIsPublishing(true);
    try {
      if (!(await form.trigger())) {
        const firstStep = stepFields.findIndex((fields) =>
          fields.some((field) => form.getFieldState(field).invalid),
        );
        setStep(firstStep < 0 ? 0 : firstStep);
        toast.error("Completa os campos indicados antes de publicar.");
        return;
      }
      // Finish the current write before saving the latest values. A failed
      // autosave can be retried here with the same creation key/project ID.
      await activeSave.current?.catch(() => undefined);
      setSaveState("saving");
      const saved = await persist(structuredClone(form.getValues()));
      setSaveState("saved");
      const response = await API.post<ItemResponse<SavedProject & { status: string }>>(
        `/projects/${saved.id}/publish`,
        undefined,
        requestOptions,
      );
      finished.current = true;
      if (storageKey) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* optional recovery */
        }
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-map"] });
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      toast.success(
        response.data.data.status === "pending"
          ? "Projeto enviado para revisão. Ainda não está público."
          : "Projeto publicado. Já está no ar!",
      );
      celebrateLaunch(saved.id);
      void navigate({ to: "/dashboard/releases" });
    } catch (error) {
      setSaveState("error");
      failedSignature.current = JSON.stringify(form.getValues());
      if (error instanceof AxiosError) {
        const issues = error.response?.data?.error?.issues as
          { path: string; message: string }[] | undefined;
        if (issues?.length) {
          issues.forEach((issue) =>
            form.setError(issue.path as keyof CreateProjectInput, { message: issue.message }),
          );
          const root = issues[0].path.split(".")[0];
          const errorStep = stepFields.findIndex((fields) =>
            fields.includes(root as keyof CreateProjectInput),
          );
          setStep(errorStep < 0 ? 0 : errorStep);
        }
      }
      toast.error(
        "Não foi possível publicar. O rascunho continua disponível para corrigir ou tentar novamente.",
      );
    } finally {
      publishing.current = false;
      setIsPublishing(false);
    }
  }
  function resumeRecovery() {
    if (!recovery) return;
    projectId.current = project?.id ?? recovery.projectId;
    creationKey.current = recovery.creationKey;
    form.reset(recovery.values as CreateProjectInput);
    setStep(recovery.step);
    lastSaved.current = "";
    failedSignature.current = null;
    setSaveState("unsaved");
    setRecovery(null);
  }
  function discardRecovery() {
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* optional recovery */
      }
    }
    setRecovery(null);
  }
  return (
    <SumbmitContext.Provider
      value={{
        form,
        active: step,
        isFist: step === 0,
        isLast: step === 3,
        next: () => changeStep(step + 1),
        previous: () => changeStep(step - 1),
        goToStep: changeStep,
        saveDraft: () => void save(true),
        publish: () => void publish(),
        canProceed: !recovery,
        canSave,
        isSaving,
        isPublishing,
        saveState,
        recovery,
        resumeRecovery,
        discardRecovery,
        project,
      }}
    >
      {children}
    </SumbmitContext.Provider>
  );
}
