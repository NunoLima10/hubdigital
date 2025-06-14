import { PathConstants } from "@/app/router";
import { useUser } from "@clerk/react-router";
import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

export function ForceOnboarding({ children }: PropsWithChildren) {
  const { user } = useUser();

  const onboarded = user?.publicMetadata?.onboarded;
  console.log("onboarded", onboarded);

  if (!onboarded) return <Navigate to={PathConstants.onboarding} replace />;
  return children;
}
