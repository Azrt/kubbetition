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
import { Public } from 'src/common/decorators/public.decorator';

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
      const jwtToken = await this.authService.generateJwt({
        sub: user.id,
        email: user.email,
      });

      const data = {
        user,
        token: jwtToken,
      };

      res.status(HttpStatus.OK).json(data);
    } catch {
      res.status(HttpStatus.BAD_REQUEST);
    }
  }
}
