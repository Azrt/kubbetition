import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { Auth, google } from 'googleapis';
import { EmailConfirmationService } from 'src/email/emailConfirmation.service';
import { parseGoogleUserData } from './auth.helpers';

@Injectable()
export class AuthService {
  private clientId;
  private clientSecret;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailConfirmationService: EmailConfirmationService
  ) {
    this.clientId = this.configService.get("GOOGLE_CLIENT_ID");
    this.clientSecret = this.configService.get("GOOGLE_SECRET");
  }

  generateJwt(payload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_SECRET"),
      expiresIn: `${this.configService.get("JWT_EMAIL_EXPIRATION_TIME")}s`,
    });
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new BadRequestException("No user from google");
    }

    const user = {
      ...req.user,
      image: req.user.picture,
    };

    return user;
  }

  async getGoogleUser(access_token: string) {
    const oauth2Client = new google.auth.OAuth2({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      credentials: {
        access_token,
      },
    });

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    return parseGoogleUserData(data);
  }

  async googleTokenLogin(idToken: string) {
    try {
      const user = await this.getGoogleUser(idToken);

      const existingUser = await this.findUserByEmail(user.email);

      if (!existingUser) {
        return this.registerUser(user);
      }

      if (!existingUser.isEmailConfirmed) {
        throw new BadRequestException(
          `${existingUser.email} user is not active`
        );
      }

      return existingUser;
    } catch (e) {
      throw new BadRequestException(e?.message ?? "Invalid user token");
    }
  }

  async registerUser(user: CreateUserDto) {
    try {
      const newUser = await this.usersService.create(user);

      return newUser;
    } catch {
      throw new BadRequestException();
    }
  }

  async findUserByEmail(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return null;
    }

    return user;
  }
}
