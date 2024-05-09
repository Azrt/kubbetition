import { SetMetadata } from "@nestjs/common";
import { Role } from "../enums/role.enum";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Array<Role>) => SetMetadata(ROLES_KEY, roles);
export const IncludeAdminRoles = (...roles: Array<Role>) => Roles(...roles, Role.SUPERADMIN, Role.ADMIN);
