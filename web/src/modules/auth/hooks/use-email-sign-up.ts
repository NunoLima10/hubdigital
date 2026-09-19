import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { EmailSignUpCredentials } from "../schemas/auth-schema";
import type { MutationOptions } from "../types";
import { getAuthErrorMessage } from "../utils/get-auth-error-message";

export function useEmailSignUp(options: MutationOptions) {
  const { useSession, signUp } = authClient;
  const { isPending } = useSession();
  const [submitting, setSubmitting] = useState(false);

  async function emailSignUp(credentials: EmailSignUpCredentials) {
    setSubmitting(true);
    const { error } = await signUp.email({
      email: credentials.email,
      name: credentials.name,
      password: credentials.password,
    });
    setSubmitting(false);

    if (error?.code) {
      const message =
        getAuthErrorMessage(error.code) ?? "Não foi possível criar a conta";
      options.onError?.(message);
      return;
    }
    options.onSuccess?.();
  }

  return { emailSignUp, isPending: isPending || submitting };
}
