import { authClient } from "@/lib/auth-client";

type SignedOutProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function SignedOut({ children, fallback = null }: SignedOutProps) {
  const { useSession } = authClient;
  const { data, isPending } = useSession();

  // Optimistically signed-out while the session resolves, so the login affordance
  // is visible immediately on a cold load.
  if (isPending) return children;

  return data ? fallback : children;
}
