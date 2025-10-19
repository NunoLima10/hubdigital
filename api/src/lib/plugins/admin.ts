import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";

export const adminRoles = ["admin", "user"] as const;

export type UserRole = (typeof adminRoles)[number];

export const ADMIN_ROLES: string[] = [...adminRoles]

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
