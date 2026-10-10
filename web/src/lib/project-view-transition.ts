import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

type ProjectTransition = {
  projectId: number;
  source: string;
  slug: string;
  title: string;
  description: string;
  iconUrl?: string | null;
  topics: string[];
};
let selected: ProjectTransition | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useProjectViewTransition() {
  return useSyncExternalStore(subscribe, () => selected, () => null);
}

export function selectProjectViewTransition(project: ProjectTransition) {
  // Set the source name before Router captures the old page. Keep it selected
  // across navigation so the same list instance participates on the way back.
  flushSync(() => {
    selected = project;
    listeners.forEach((listener) => listener());
  });
}

export function projectViewTransitionName(projectId: number) {
  return `project-summary-${projectId}`;
}
