import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamMembersDto } from "./dto/update-team.dto";
import { ApiBearerAuth } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { TEAMS_PAGINATION_CONFIG } from './teams.constants';
import { Team } from './entities/team.entity';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';
import { SameTeamGuard } from 'src/common/guards/same-team.guard';
import { IncludeAdminRoles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { EmptyTeamGuard } from 'src/common/guards/empty-team.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(EmptyTeamGuard)
  create(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: User) {
    return this.teamsService.create(createTeamDto, user);
  }

  @Get()
  @PaginatedSwaggerDocs(CreateTeamDto, TEAMS_PAGINATION_CONFIG)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Team>> {
    return this.teamsService.findAll(query);
  }

  @Get("my")
  getMyTeam(@CurrentUser() user: User) {
    return this.teamsService.getMyTeam(user);
  }

  @Get(":teamId")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("teamId") teamId: string) {
    return this.teamsService.findOne(+teamId);
  }

  @Patch(":teamId")
  @UseGuards(SameTeamGuard)
  @IncludeAdminRoles()
  @UseInterceptors(NotFoundInterceptor)
  update(
    @Param("teamId") teamId: string,
    @Body() updateTeamDto: UpdateTeamMembersDto
  ) {
    return this.teamsService.update(+teamId, updateTeamDto);
  }

  @Delete(":teamId")
  @UseGuards(SameTeamGuard)
  @IncludeAdminRoles(Role.SUPERVISOR)
  remove(@Param("teamId") teamId: string) {
    return this.teamsService.remove(+teamId);
  }
}
