import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { TeamSectionsService } from "./teamSections.service";
import { CreateTeamSectionDto } from "./dto/create-team-section.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { ApiBearerAuth } from "@nestjs/swagger";
import { SWAGGER_BEARER_TOKEN } from "src/app.constants";
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from "nestjs-paginate";
import { TeamSection } from "./entities/teamSection.entity";
import { TEAM_SECTIONS_PAGINATION_CONFIG } from "./teamSections.constants";
import { UpdateTeamSectionDto } from "./dto/update-team-section.dto";
import { GameType } from "src/common/enums/gameType";
import { GameTypePipe } from "src/common/pipes/game-type.pipe";

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
  @PaginatedSwaggerDocs(CreateTeamSectionDto, TEAM_SECTIONS_PAGINATION_CONFIG)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<TeamSection>> {
    return this.teamSectionsService.findAll(query);
  }

  @Get("members")
  @UseGuards(JwtAuthGuard)
  findByMembers(@Query("ids") ids: string, @Query("type", GameTypePipe) type?: GameType) {
    const filteredIds = ids.split(',').map((id) => Number(id)).filter(Boolean)
    return this.teamSectionsService.findByMembers(filteredIds, type);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: number) {
    return this.teamSectionsService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id") id: string,
    @Body() updateTeamSectionDto: UpdateTeamSectionDto
  ) {
    return this.teamSectionsService.update(+id, updateTeamSectionDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.teamSectionsService.remove(+id);
  }
}
