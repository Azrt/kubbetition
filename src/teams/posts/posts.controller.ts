import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { PostsService } from './posts.service';
import { Post as PostEntity } from 'src/teams/entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';
import { POSTS_PAGINATION_CONFIG } from './posts.constants';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { SameTeamGuard } from 'src/common/guards/same-team.guard';

@ApiTags('teams')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller('teams/:teamId/posts')
@UseGuards(SameTeamGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @PaginatedSwaggerDocs(PostEntity, POSTS_PAGINATION_CONFIG)
  findAll(
    @Param('teamId') teamId: string,
    @Paginate() query: PaginateQuery,
    @CurrentUser() user: User,
  ): Promise<Paginated<PostEntity>> {
    return this.postsService.findAll(teamId, query, user);
  }

  @Get(':id')
  @UseInterceptors(NotFoundInterceptor)
  findOne(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.findOne(teamId, id, user);
  }

  @Post()
  create(
    @Param('teamId') teamId: string,
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.create(teamId, createPostDto, user);
  }

  @Patch(':id')
  @UseInterceptors(NotFoundInterceptor)
  update(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.update(teamId, id, updatePostDto, user);
  }

  @Delete(':id')
  @UseInterceptors(NotFoundInterceptor)
  remove(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.remove(teamId, id, user);
  }

  @Put(':postId/reactions')
  @UseInterceptors(NotFoundInterceptor)
  setReaction(
    @Param('teamId') teamId: string,
    @Param('postId') postId: string,
    @Body() setReactionDto: SetReactionDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.setReaction(teamId, postId, setReactionDto.type, user);
  }

  @Delete(':postId/reactions')
  @UseInterceptors(NotFoundInterceptor)
  removeReaction(
    @Param('teamId') teamId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: User,
  ) {
    return this.postsService.removeReaction(teamId, postId, user);
  }
}
