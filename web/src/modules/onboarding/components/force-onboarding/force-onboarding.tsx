import { authClient } from "@/lib/auth-client";
import { Navigate } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export function ForceOnboarding({ children }: PropsWithChildren) {
  const { useSession } = authClient;
  const { data } = useSession();

  const onboarded =
    data?.user && "onboardedAt" in data.user ? data.user.onboardedAt : null;

  if (!onboarded) return <Navigate to={"/onboarding"} replace />;
  return children;
}
