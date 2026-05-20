import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { isAdminRole } from 'src/common/helpers/user';
import { UsersService } from './users.service';
import { AuthService } from 'src/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService, FileType } from 'src/common/services/file-upload.service';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from 'src/app.constants';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundInterceptor } from 'src/common/interceptors/not-found.interceptor';
import { UpdateUserTokenDto } from './dto/update-user-token.dto';
import { UpdateUserParam } from './dto/update-user-param.dto';
import { ParamContextInterceptor } from 'src/common/interceptors/param-context-interceptor';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from './entities/user.entity';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { FriendRequestParamDto } from './dto/friend-request-param.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { SearchUserResponseDto } from './dto/search-user-response.dto';
import { SimpleUserDto } from 'src/common/dto/simple-user.dto';
import { FriendRequestListItemDto } from './dto/friend-request-list-item.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { USERS_PAGINATION_CONFIG } from './users.constants';
import { GamesService } from 'src/games/games.service';
import { Game } from 'src/games/entities/game.entity';

@ApiTags('users')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
    private readonly authService: AuthService,
    private readonly gamesService: GamesService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @PaginatedSwaggerDocs(User, USERS_PAGINATION_CONFIG)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAll(query);
  }

  @Get("search")
  @ApiResponse({ status: 200, description: 'List of users with limited fields.', type: [SearchUserResponseDto] })
  search(
    @Query() searchParams: SearchUsersDto,
    @CurrentUser() user: User
  ): Promise<SearchUserResponseDto[]> {
    return this.usersService.search(
      searchParams.email,
      searchParams.lastName,
      searchParams.teamId,
      searchParams.excludeWithFriendRequest,
      user
    );
  }

  @Get("friends")
  @ApiResponse({ status: 200, description: 'List of friends.', type: [SimpleUserDto] })
  getFriends(@CurrentUser() user: User) {
    return this.usersService.getFriends(user);
  }

  @Get("friends/requests/received")
  @ApiResponse({ status: 200, description: 'Received friend requests.', type: [FriendRequestListItemDto] })
  getReceivedFriendRequests(@CurrentUser() user: User) {
    return this.usersService.getReceivedFriendRequests(user);
  }

  @Get("friends/requests/sent")
  @ApiResponse({ status: 200, description: 'Sent friend requests.', type: [FriendRequestListItemDto] })
  getSentFriendRequests(@CurrentUser() user: User) {
    return this.usersService.getSentFriendRequests(user);
  }

  @Post("friends/requests")
  createFriendRequest(
    @Body() createFriendRequestDto: CreateFriendRequestDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.createFriendRequest(createFriendRequestDto, user);
  }

  @Post("friends/requests/:friendRequestId/accept")
  acceptFriendRequest(
    @Param() params: FriendRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.acceptFriendRequest(
      params.friendRequestId,
      user
    );
  }

  @Post("friends/requests/:friendRequestId/reject")
  rejectFriendRequest(
    @Param() params: FriendRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.rejectFriendRequest(
      params.friendRequestId,
      user
    );
  }

  @Delete("friends/requests/:friendRequestId")
  deleteFriendRequest(
    @Param() params: FriendRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.deleteFriendRequest(
      params.friendRequestId,
      user
    );
  }

  @Get(':userId/history')
  @ApiQuery({ name: 'cancelled', required: false, type: Boolean, description: 'If true, include cancelled games' })
  @ApiQuery({ name: 'inProgress', required: false, type: Boolean, description: 'If true, include games in progress (default: only finished games)' })
  async getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: User,
    @Paginate() query: PaginateQuery,
    @Query('cancelled') cancelled?: string,
    @Query('inProgress') inProgress?: string,
  ): Promise<Paginated<Game>> {
    const targetUser = await this.usersService.findOne(userId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const canView = await this.usersService.canViewUserGameHistory(
      currentUser,
      userId,
    );
    if (!canView) {
      throw new ForbiddenException(
        'You are not allowed to view this user\'s game history',
      );
    }

    const includeCancelled = cancelled === 'true';
    const includeInProgress = inProgress === 'true';
    return this.gamesService.findUserPublicHistory(
      userId,
      query,
      includeCancelled,
      includeInProgress,
    );
  }

  @Get(":id")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post(":id/image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    // Only allow users to upload their own avatar or admins
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN';
    if (id !== currentUser.id && !isAdmin) {
      throw new ForbiddenException('You can only upload your own avatar');
    }

    const filePath = await this.fileUploadService.uploadFile(file, FileType.USER_AVATAR, id, {
      resize: { width: 600, height: 600 },
      format: 'jpeg',
    });

    // Delete old image if exists
    const user = await this.usersService.findOne(id);
    if (user?.image) {
      await this.fileUploadService.deleteFile(user.image, FileType.USER_AVATAR);
    }

    // Store the file path (format: user/{userId}/avatar.jpg) in database
    return this.usersService.uploadImage(id, filePath);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (id !== currentUser.id && !isAdminRole(currentUser)) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    if (id !== currentUser.id && !isAdminRole(currentUser)) {
      throw new ForbiddenException('You can only delete your own account');
    }
    await this.authService.revokeAllUserTokens(id);
    return this.usersService.remove(id);
  }

  @Patch(":id/token")
  @UseInterceptors(ParamContextInterceptor)
  async updateCurrentUserToken(
    @Param() params: UpdateUserParam,
    @Body() body: UpdateUserTokenDto
  ) {
    return this.usersService.updateCurrentUserToken(params.id, body);
  }
}
