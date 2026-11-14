import { authClient } from "@/lib/auth-client";
import type { EmailSignInCredentials } from "../schemas/auth-schema";
import type { MutationOptions } from "../types";
import { useAuthSubmit } from "./use-auth-submit";

export function useEmailSignIn(options: MutationOptions) {
  const { submit, isPending } = useAuthSubmit(
    (credentials: EmailSignInCredentials) =>
      authClient.signIn.email({ email: credentials.email, password: credentials.password }),
    "Não foi possível iniciar sessão",
    options,
  );
  return { emailSignIn: submit, isPending };
}
