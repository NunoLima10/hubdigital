import { staffRoleValues, type UserRole } from "@hubdigital/shared";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";

export type { UserRole };

/**
 * Handed to Better Auth's admin plugin as `adminRoles` — the roles it will let
 * call `/v1/auth/admin/*` (set-role, ban-user, impersonate, …). The single
 * source for it is `staffRoleValues`; nothing here may widen it.
 */
export const ADMIN_ROLES: string[] = [...staffRoleValues];

export const statement = {
    ...defaultStatements,
    project: ["create", "share", "update", "delete"], // <-- Permissions available for created roles
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
    project: ["create", "delete", "update"],
});

export const admin = ac.newRole({
    project: ["delete"],
    ...adminAc.statements,
});

export const ROLES_AC = {
    admin,
    user,
}
