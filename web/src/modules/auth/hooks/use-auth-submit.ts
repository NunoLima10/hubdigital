import { useState } from "react";
import type { MutationOptions } from "../types";
import { getAuthErrorMessage } from "../utils/get-auth-error-message";

type AuthResult = { error: { code?: string; status?: number } | null };

const OFFLINE_MESSAGE =
  "Não foi possível contactar o servidor. Verifica a ligação e tenta de novo.";

/**
 * Runs a Better Auth call and reports its outcome. Any error counts as a
 * failure — a network error has no code, and used to be read as success — and
 * the button state comes from this request alone, so a session check that never
 * settles cannot leave the form stuck on "A criar...".
 */
export function useAuthSubmit<TInput>(
  request: (input: TInput) => Promise<AuthResult>,
  fallbackMessage: string,
  options: MutationOptions,
) {
  const [isPending, setIsPending] = useState(false);

  async function submit(input: TInput) {
    setIsPending(true);
    try {
      const { error } = await request(input);
      if (error) {
        options.onError?.(
          (error.code && getAuthErrorMessage(error.code)) ||
            (error.status ? fallbackMessage : OFFLINE_MESSAGE),
        );
        return;
      }
      options.onSuccess?.();
    } catch {
      options.onError?.(OFFLINE_MESSAGE);
    } finally {
      setIsPending(false);
    }
  }

  return { submit, isPending };
}
