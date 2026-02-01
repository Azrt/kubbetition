import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreateTeamRequestDto } from "./dto/create-team-request.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SWAGGER_BEARER_TOKEN } from "src/app.constants";
import { TeamRequestsService } from "./team-requests.service";
import { Paginate, PaginateQuery, Paginated } from "nestjs-paginate";
import { TeamRequest } from "./entities/team-request.entity";
import { User } from "src/users/entities/user.entity";
import { CurrentUser } from "src/common/decorators/currentUser.decorator";
import { EmptyTeamGuard } from "src/common/guards/empty-team.guard";
import { IncludeAdminRoles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/role.enum";
import { TeamRequestParamDto } from "./dto/team-request-param.dto";

@ApiTags('team-requests')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("team-requests")
export class TeamRequestsController {
  constructor(private readonly teamRequestsService: TeamRequestsService) {}

  @Post()
  @UseGuards(EmptyTeamGuard)
  create(
    @Body() createTeamRequestDto: CreateTeamRequestDto,
    @CurrentUser() user: User
  ) {
    return this.teamRequestsService.create(createTeamRequestDto, user);
  }

  @Get()
  @IncludeAdminRoles(Role.SUPERVISOR)
  findAll(
    @Paginate() query: PaginateQuery,
    @CurrentUser() user: User
  ): Promise<Paginated<TeamRequest>> {
    return this.teamRequestsService.findAll(query, user);
  }

  @Post(":teamRequestId/accept")
  @IncludeAdminRoles(Role.SUPERVISOR)
  acceptTeamRequest(
    @Param() params: TeamRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.teamRequestsService.acceptTeamRequest(
      params.teamRequestId,
      user
    );
  }

  @Post(":teamRequestId/reject")
  @IncludeAdminRoles(Role.SUPERVISOR)
  rejectTeamRequest(
    @Param() params: TeamRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.teamRequestsService.rejectTeamRequest(
      params.teamRequestId,
      user
    );
  }

  @Delete(":teamRequestId")
  @IncludeAdminRoles()
  remove(
    @Param() params: TeamRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.teamRequestsService.remove(params.teamRequestId, user);
  }
}