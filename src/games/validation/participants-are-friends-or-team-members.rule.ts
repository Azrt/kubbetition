import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { UsersService } from "src/users/users.service";
import { TeamsService } from "src/teams/teams.service";
import { isAdminRole } from "src/common/helpers/user";

@ValidatorConstraint({ async: true, name: "ParticipantsAreFriendsOrTeamMembers" })
@Injectable()
export class ParticipantsAreFriendsOrTeamMembersRule implements ValidatorConstraintInterface {
  constructor(
    private usersService: UsersService,
    private teamsService: TeamsService,
  ) {}

  async validate(participantIds: Array<string>, validationArguments: ValidationArguments) {
    if (!participantIds?.length) return true; // Empty array is valid (optional field)

    const dto = validationArguments.object as any;
    const currentUser = dto.context?.user;

    if (!currentUser) {
      // If no context user, allow validation to pass (auth should handle this)
      return true;
    }

    // Admins can add anyone
    if (isAdminRole(currentUser)) {
      return true;
    }

    // Get user's friends
    const friends = await this.usersService.getFriends(currentUser);
    const friendIds = new Set(friends.map((friend) => friend.id));

    // Get user's team members (load team with members via TeamsService)
    const teamMemberIds = new Set<string>();
    if (currentUser.team?.id) {
      const team = await this.teamsService.findOne(currentUser.team.id);
      if (team?.members?.length) {
        team.members.forEach((member) => {
          if (member.id !== currentUser.id) {
            teamMemberIds.add(member.id);
          }
        });
      }
    }

    // Check if all participants are either friends or team members
    for (const participantId of participantIds) {
      // Allow adding yourself
      if (participantId === currentUser.id) continue;

      if (!friendIds.has(participantId) && !teamMemberIds.has(participantId)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Participants must be from your friends list or team members";
  }
}
