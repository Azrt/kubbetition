import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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

@ApiBearerAuth(SWAGGER_BEARER_TOKEN)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
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
}
