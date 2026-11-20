import { Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, type PropsWithChildren } from "react";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_SIGNED_IN_PATH } from "../../utils/redirect";

// Keeps signed-in users out of the auth screens. While the session is still
// resolving we render the form optimistically so it shows without a flash,
// then redirect if a session turns out to exist.
export function GuestGuard({
  children,
  redirectTo,
}: PropsWithChildren<{ redirectTo?: string }>) {
  const { data, isPending } = authClient.useSession();

  if (isPending || !data) return <>{children}</>;

  if (!redirectTo) return <Navigate to={DEFAULT_SIGNED_IN_PATH} replace />;

  return <RedirectTo href={redirectTo} />;
}

// The return path may carry its own query and hash, so it goes through history
// as a raw path rather than a typed route.
function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.history.replace(href);
  }, [router, href]);
  return null;
}
