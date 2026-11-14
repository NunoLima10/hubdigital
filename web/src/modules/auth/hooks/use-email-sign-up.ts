import { authClient } from "@/lib/auth-client";
import type { EmailSignUpCredentials } from "../schemas/auth-schema";
import type { MutationOptions } from "../types";
import { useAuthSubmit } from "./use-auth-submit";

export function useEmailSignUp(options: MutationOptions) {
  const { submit, isPending } = useAuthSubmit(
    (credentials: EmailSignUpCredentials) =>
      authClient.signUp.email({
        email: credentials.email,
        name: credentials.name,
        password: credentials.password,
      }),
    "Não foi possível criar a conta",
    options,
  );
  return { emailSignUp: submit, isPending };
}
