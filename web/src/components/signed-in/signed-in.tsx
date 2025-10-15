import { authClient } from "@/lib/auth-client";

type SignedInProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function SignedIn({ children, fallback }: SignedInProps) {
  const { useSession } = authClient;
  const { data, isPending, error } = useSession();

  if (data) return children;
  if (isPending) fallback;
  if (error) fallback;
}
