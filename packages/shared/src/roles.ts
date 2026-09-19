/**
 * Roles stored on `users.role`. `user` is Better Auth's `defaultRole` and the
 * only role a self-registered account ever gets.
 */
export const userRoleValues = ["user", "admin"] as const;

export type UserRole = (typeof userRoleValues)[number];

/**
 * The roles that count as staff: what Better Auth's admin plugin accepts as
 * `adminRoles`, and what the `/v1/admin` guard lets through.
 *
 * It must never contain `user`. It did, which — with `defaultRole: "user"` —
 * made every signed-in account an admin as far as the plugin was concerned.
 * Kept as its own array despite holding a single value so that adding a
 * `moderator` tier later is one edit here rather than a hunt through call
 * sites (see specs/ADMIN.md §A1).
 */
export const staffRoleValues = ["admin"] as const;

export type StaffRole = (typeof staffRoleValues)[number];

export function isStaffRole(role: unknown): role is StaffRole {
  return (
    typeof role === "string" && staffRoleValues.includes(role as StaffRole)
  );
}
