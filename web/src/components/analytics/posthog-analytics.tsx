import { authClient } from "@/lib/auth-client";
import { identifyUser, initAnalytics, resetUser } from "@/lib/posthog";
import { useEffect, useRef } from "react";

/**
 * Starts PostHog in the browser and keeps its identity in step with the
 * session: identify on sign-in, reset on sign-out. Renders nothing.
 */
export function PostHogAnalytics() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  const userId = user?.id;
  const onboarded = Boolean(user && "onboardedAt" in user && user.onboardedAt);
  const role =
    user && "role" in user && typeof user.role === "string" ? user.role : "user";
  const identifiedAs = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (userId) {
      identifyUser(userId, { role, onboarded });
      identifiedAs.current = userId;
    } else if (identifiedAs.current) {
      resetUser();
      identifiedAs.current = null;
    }
  }, [isPending, userId, role, onboarded]);

  return null;
}
