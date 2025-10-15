import { authClient } from "@/lib/auth-client";
import { Navigate } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export function ForceOnboarding({ children }: PropsWithChildren) {
  const { useSession } = authClient;
  const { data } = useSession();

  // @ts-ignore
  const onboarded = data?.user.onboardedAt;
  console.log(data?.user);

  if (!onboarded) return <Navigate to={"/onboarding"} replace />;
  return children;
}
