import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { GoogleLoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get("google")
  @UseGuards(GoogleOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() _req) {}

  @Public()
  @Get("google/redirect")
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      res.status(200).send({
        accessToken: req.user.accessToken,
      });
    } catch (e) {
      res.redirect("/login");
    }
  }

  @Public()
  @Post("google/login")
  async googleTokenLogin(
    @Body() params: GoogleLoginDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const user = await this.authService.googleTokenLogin(params.token);
      const tokens = this.authService.generateTokens(user);

      const data = {
        user,
        ...tokens,
      };

      res.status(HttpStatus.OK).json(data);
    } catch (e) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: e?.message ?? 'Google login failed',
        error: 'Bad Request',
      });
    }
  }

  @Public()
  @Post("refresh")
  async refreshTokens(
    @Body() params: RefreshTokenDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const tokens = await this.authService.refreshTokens(params.refreshToken);
      res.status(HttpStatus.OK).json(tokens);
    } catch (e) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: e.message });
    }
  }

  @Get("me")
  async currentUserData(@CurrentUser() user: User) {
    return this.authService.getCurrentUser(user);
  }
}
