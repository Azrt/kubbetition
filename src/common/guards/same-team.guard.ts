import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Team } from "src/teams/entities/team.entity";
import { Role } from "../enums/role.enum";

@Injectable()
export class SameTeamGuard implements CanActivate {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const teamId = request.params.teamId;
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPERADMIN;

    if (isAdmin || (!!user.team?.id && user.team.id === teamId)) {
      return true;
    }

    // Check if user is the team creator
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['createdBy'],
    });

    if (team?.createdBy?.id === user.id) {
      return true;
    }

    throw new UnauthorizedException("Teams doesn't match");
  }
}
