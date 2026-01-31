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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService, FileType } from 'src/common/services/file-upload.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

@ApiTags('users')
@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get("search")
  search(@Query() searchParams: SearchUsersDto) {
    return this.usersService.search(
      searchParams.email,
      searchParams.lastName,
      searchParams.teamId
    );
  }

  @Get("friends")
  getFriends(@CurrentUser() user: User) {
    return this.usersService.getFriends(user);
  }

  @Get("friends/requests/received")
  getReceivedFriendRequests(@CurrentUser() user: User) {
    return this.usersService.getReceivedFriendRequests(user);
  }

  @Get("friends/requests/sent")
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
      +params.friendRequestId,
      user
    );
  }

  @Post("friends/requests/:friendRequestId/reject")
  rejectFriendRequest(
    @Param() params: FriendRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.rejectFriendRequest(
      +params.friendRequestId,
      user
    );
  }

  @Delete("friends/requests/:friendRequestId")
  deleteFriendRequest(
    @Param() params: FriendRequestParamDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.deleteFriendRequest(
      +params.friendRequestId,
      user
    );
  }

  @Get(":id")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(+id);
  }

  @Post(":id/image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
  ) {
    // Only allow users to upload their own avatar or admins
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN';
    if (+id !== currentUser.id && !isAdmin) {
      throw new ForbiddenException('You can only upload your own avatar');
    }

    const filePath = await this.fileUploadService.uploadFile(file, FileType.USER_AVATAR, +id, {
      resize: { width: 600, height: 600 },
      format: 'jpeg',
    });

    // Delete old image if exists
    const user = await this.usersService.findOne(+id);
    if (user?.image) {
      await this.fileUploadService.deleteFile(user.image, FileType.USER_AVATAR);
    }

    // Store the file path (format: user/{userId}/avatar.jpg) in database
    return this.usersService.uploadImage(+id, filePath);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(+id);
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
