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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThumbnailPipe } from 'src/common/pipes/thumbnail.pipe';
import { ApiBearerAuth } from '@nestjs/swagger';
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

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get("friends")
  getFriends(@CurrentUser() user: User) {
    return this.usersService.getFriends(user);
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

  @Get(":id")
  @UseInterceptors(NotFoundInterceptor)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(+id);
  }

  @Post(":id/image")
  @UseInterceptors(FileInterceptor("image"))
  uploadImage(
    @Param("id") id: string,
    @UploadedFile(ThumbnailPipe) image: string
  ) {
    return this.usersService.uploadImage(+id, image);
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
