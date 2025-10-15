import { authClient } from "@/lib/auth-client";

type SignedOutProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function SignedOut({ children, fallback }: SignedOutProps) {
  const { useSession } = authClient;
  const { data, isPending, error } = useSession();

  if (!data) return children;
  if (isPending) return children;
  if (error) return fallback;
}
