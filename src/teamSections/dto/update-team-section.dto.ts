import { PartialType } from "@nestjs/swagger";
import { CreateTeamSectionDto } from "./create-team-section.dto";

export class UpdateTeamSectionDto extends PartialType(CreateTeamSectionDto) {
  
}
