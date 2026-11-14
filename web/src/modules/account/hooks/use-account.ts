import { API } from "@/api/api";
import { useUpload } from "@/hooks/use-upload";
import { authClient } from "@/lib/auth-client";
import { ItemResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Re-reads the session past Better Auth's cookie cache, so the header and
 * dashboard pick up a new name or photo straight away.
 */
function useRefreshSession() {
  const { refetch } = authClient.useSession();
  return async () => {
    await authClient.getSession({ query: { disableCookieCache: true } });
    await refetch();
  };
}

/** Uploads a photo to R2, then points the account at it (or clears it). */
export function useAvatar() {
  const { upload, percentage, isUploading } = useUpload();
  const refreshSession = useRefreshSession();
  const [isSaving, setIsSaving] = useState(false);

  async function save(key: string | null) {
    setIsSaving(true);
    try {
      await API.put<ItemResponse<{ image: string | null }>>("/users/me/avatar", { key });
      await refreshSession();
    } finally {
      setIsSaving(false);
    }
  }

  return {
    change: async (file: File) => save(await upload(file, "user_avatar")),
    remove: () => save(null),
    percentage,
    isPending: isUploading || isSaving,
  };
}

export function useUpdateName() {
  const refreshSession = useRefreshSession();
  const [isPending, setIsPending] = useState(false);

  async function updateName(name: string) {
    setIsPending(true);
    try {
      const { error } = await authClient.updateUser({ name });
      if (error) throw error;
      await refreshSession();
    } finally {
      setIsPending(false);
    }
  }

  return { updateName, isPending };
}

/**
 * Whether the account has a password at all. Someone who only ever signed in
 * with Google has none to change.
 */
export function useHasPassword() {
  return useQuery({
    queryKey: ["account", "providers"],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      if (error) throw error;
      return data.some((account) => account.providerId === "credential");
    },
    staleTime: 5 * 60 * 1000,
  });
}
