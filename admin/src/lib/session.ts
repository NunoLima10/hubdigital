import { isStaffRole } from "@hubdigital/shared";
import { authClient } from "./auth-client";

/**
 * Better Auth types `role` as an optional string because it is free text in the
 * database. Everything that gates on it goes through here so the widening
 * happens in one place.
 */
export function useStaffSession() {
  const { data, isPending, error } = authClient.useSession();

  const role = (data?.user as { role?: string | null } | undefined)?.role;

  return {
    session: data,
    role: role ?? null,
    isStaff: isStaffRole(role),
    isPending,
    error,
  };
}
