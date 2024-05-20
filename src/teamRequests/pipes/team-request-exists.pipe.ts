import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { TeamRequestsService } from "../teamRequests.service";
@Injectable()
export class TeamRequestExistsPipe implements PipeTransform {
  constructor(private teamRequests: TeamRequestsService) {}

  async transform(value: number) {
    const teamRequest = await this.teamRequests.findOne(value);

    if (!teamRequest) {
      throw new BadRequestException({
        error: "Team request doesn`t exists",
      });
    }

    return value;
  }
}
