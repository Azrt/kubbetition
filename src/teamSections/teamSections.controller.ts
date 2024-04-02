import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { TeamSectionsService } from "./teamSections.service";
import { CreateTeamSectionDto } from "./dto/create-team-section.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { ApiBearerAuth } from "@nestjs/swagger";
import { SWAGGER_BEARER_TOKEN } from "src/app.constants";

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("team-sections")
export class TeamSectionsController {
  constructor(private readonly teamSectionsService: TeamSectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTeamSectionDto: CreateTeamSectionDto) {
    return this.teamSectionsService.create(createTeamSectionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.teamSectionsService.findAll();
  }

  @Get("/:teamId")
  @UseGuards(JwtAuthGuard)
  findAllByTeam(@Param("teamId") teamId: number) {
    return this.teamSectionsService.findAllByTeam(+teamId);
  }
}
