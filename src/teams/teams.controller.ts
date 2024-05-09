import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { TEAMS_PAGINATION_CONFIG } from './teams.constants';
import { Team } from './entities/team.entity';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: User) {
    return this.teamsService.create(createTeamDto, user);
  }

  @Get()
  @PaginatedSwaggerDocs(CreateTeamDto, TEAMS_PAGINATION_CONFIG)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Team>> {
    return this.teamsService.findAll(query);
  }

  @Get(":id")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("id") id: string) {
    return this.teamsService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(+id, updateTeamDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.teamsService.remove(+id);
  }
}
