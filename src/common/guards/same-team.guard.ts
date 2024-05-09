import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";
import { Role } from "../enums/role.enum";

@Injectable()
export class SameTeamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const teamId = request.params.teamId;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPERADMIN

    if (isAdmin || (!!user.team?.id && user.team.id === Number(teamId))) return true

    throw new UnauthorizedException("Teams doesn't match");
  }
}
