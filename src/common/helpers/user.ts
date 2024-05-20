import { User } from "src/users/entities/user.entity";
import { Role } from "../enums/role.enum";

export const ADMIN_ROLES = [Role.ADMIN, Role.SUPERADMIN]
export const USER_ROLES = [Role.SUPERVISOR, Role.USER]

export const isAdminRole = (user: User) => ADMIN_ROLES.includes(user.role);
export const isUserRole = (user: User) => USER_ROLES.includes(user.role);
export const isSupervisorRole = (user: User) => user.role === Role.SUPERVISOR;