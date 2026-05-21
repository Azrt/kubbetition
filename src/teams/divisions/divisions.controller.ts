import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { AuthGuard } from '@nestjs/passport';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { UpdateDivisionDto } from './dto/update-division.dto';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';
import { SameTeamGuard } from 'src/common/guards/same-team.guard';
import { Division } from '../entities/division.entity';

@ApiTags('teams')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller('teams/:teamId/divisions')
@UseGuards(AuthGuard('jwt'), SameTeamGuard)
export class DivisionsController {
  constructor(private readonly divisionsService: DivisionsService) {}

  @Post()
  async create(
    @Param('teamId') teamId: string,
    @Body() createDivisionDto: CreateDivisionDto,
    @CurrentUser() user: User,
  ): Promise<Division> {
    return this.divisionsService.create(teamId, createDivisionDto, user);
  }

  @Get()
  async findAll(
    @Param('teamId') teamId: string,
    @CurrentUser() user: User,
  ): Promise<Division[]> {
    return this.divisionsService.findAllByTeam(teamId, user);
  }

  @Get(':divisionId')
  async findOne(
    @Param('teamId') teamId: string,
    @Param('divisionId') divisionId: string,
    @CurrentUser() user: User,
  ): Promise<Division> {
    return this.divisionsService.findOne(teamId, divisionId, user);
  }

  @Patch(':divisionId')
  async update(
    @Param('teamId') teamId: string,
    @Param('divisionId') divisionId: string,
    @Body() updateDivisionDto: UpdateDivisionDto,
    @CurrentUser() user: User,
  ): Promise<Division> {
    return this.divisionsService.update(teamId, divisionId, updateDivisionDto, user);
  }

  @Delete(':divisionId')
  async remove(
    @Param('teamId') teamId: string,
    @Param('divisionId') divisionId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.divisionsService.remove(teamId, divisionId, user);
  }
}
