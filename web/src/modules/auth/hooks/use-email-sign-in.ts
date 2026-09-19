import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { EmailSignInCredentials } from "../schemas/auth-schema";
import type { MutationOptions } from "../types";
import { getAuthErrorMessage } from "../utils/get-auth-error-message";

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

    if (error?.code) {
      const message =
        getAuthErrorMessage(error.code) ?? "Não foi possível iniciar sessão";
      options.onError?.(message);
      return;
    }
    options.onSuccess?.();
  }

  return { emailSignIn, isPending: isPending || submitting };
}
