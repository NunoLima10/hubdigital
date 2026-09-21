import { authClient } from "@/lib/auth-client";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  // Depends on the visitor's session, and is worth nothing to a search engine:
  // rendered in the browser only.
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { useSession } = authClient;
  const { data, isPending, error } = useSession();

  //  // @ts-ignore
  //   const role = data?.user.role
  //   if (data && role != UserRole) signOut();

  if (isPending || error || !data) return <Navigate to={"/"} replace />;

  return <Outlet />;
}
