import { useEffect } from "react";
import { trackProjectEvent } from "../utils/track-project-event";

/**
 * Counts a view when a project's page (or its modal) is shown. Runs in an
 * effect, so it only ever fires in a real browser: the server render and any
 * crawler that does not run scripts never reach it.
 */
export function useTrackProjectView(projectId: number | undefined) {
  useEffect(() => {
    if (projectId === undefined) return;

    trackProjectEvent(projectId, "view");
  }, [projectId]);
}
