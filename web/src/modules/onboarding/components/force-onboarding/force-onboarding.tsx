import { useUser } from "@clerk/clerk-react";
import { Navigate } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export function ForceOnboarding({ children }: PropsWithChildren) {
  const { user } = useUser();

  const onboarded = user?.publicMetadata?.onboarded;


  if (!onboarded) return <Navigate to={"/onboarding"} replace />;
  return children;
}
