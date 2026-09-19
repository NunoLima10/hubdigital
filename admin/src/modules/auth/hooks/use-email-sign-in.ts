import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { EmailSignInCredentials } from "../schemas/auth-schema";
import type { MutationOptions } from "../types";

export function useEmailSignIn(options: MutationOptions) {
  const { useSession, signIn } = authClient;
  const { isPending } = useSession();
  const [submitting, setSubmitting] = useState(false);

  async function emailSignIn(credentials: EmailSignInCredentials) {
    setSubmitting(true);
    const { error } = await signIn.email({
      email: credentials.email,
      password: credentials.password,
    });
    setSubmitting(false);

    // Deliberately vague: distinguishing "no such account" from "wrong
    // password" on a staff login tells an attacker which emails are staff.
    if (error) {
      options.onError?.("Credenciais inválidas.");
      return;
    }
    options.onSuccess?.();
  }

  return { emailSignIn, isPending: isPending || submitting };
}
