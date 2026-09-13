import { Navigate } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import { authClient } from "@/lib/auth-client";

// Keeps signed-in users out of the auth screens. While the session is still
// resolving we render the form optimistically so it shows without a flash,
// then redirect if a session turns out to exist.
export function GuestGuard({ children }: PropsWithChildren) {
  const { data, isPending } = authClient.useSession();

  if (isPending) return <>{children}</>;

  if (data) return <Navigate to="/dashboard/releases" replace />;

  return <>{children}</>;
}
