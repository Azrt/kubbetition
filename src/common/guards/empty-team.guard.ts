import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { Role } from "../enums/role.enum";

@Injectable()
export class EmptyTeamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPERADMIN;

    if (isAdmin || !user.team) return true

    throw new UnauthorizedException("User already has a team");
  }
}
