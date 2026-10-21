import { createContext } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateProjectInput, Project } from "../types/project";
import { draftRecoverySchema } from "../utils/draft";

export type SaveState = "unsaved" | "saving" | "saved" | "error";
export type Recovery = ReturnType<typeof draftRecoverySchema.parse>;
type SubmitContextType = {
  form: UseFormReturn<CreateProjectInput>;
  active: number;
  isFist: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
  goToStep: (step: number) => void;
  saveDraft: () => void;
  publish: () => void;
  canProceed: boolean;
  canSave: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  saveState: SaveState;
  recovery: Recovery | null;
  resumeRecovery: () => void;
  discardRecovery: () => void;
  project?: Project;
};
export const SumbmitContext = createContext<SubmitContextType | undefined>(undefined);
