import { authClient } from "@/lib/auth-client";

type SignedInProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function SignedIn({ children, fallback = null }: SignedInProps) {
  const { useSession } = authClient;
  const { data, isPending } = useSession();

  // While the session is still resolving we show the fallback rather than
  // flashing signed-in content that may not apply.
  if (isPending) return fallback;

  return data ? children : fallback;
}
