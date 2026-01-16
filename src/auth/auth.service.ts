import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { google, Auth } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { parseGoogleUserData } from './auth.helpers';
import { User } from 'src/users/entities/user.entity';
import {
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} from 'src/app.constants';
import { GeolocationService } from 'src/common/services/geolocation.service';

@Injectable()
export class AuthService {
  private clientId: string;
  private clientSecret: string;
  private oAuth2Client: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly geolocationService: GeolocationService,
  ) {
    this.clientId = this.configService.get("GOOGLE_CLIENT_ID");
    this.clientSecret = this.configService.get("GOOGLE_SECRET");
    this.oAuth2Client = new OAuth2Client(this.clientId);
  }

  generateAccessToken(payload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    });
  }

  generateRefreshToken(payload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });
  }

  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      isEmailConfirmed: user.isEmailConfirmed,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
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

  async getGoogleUserByAccessToken(access_token: string) {
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

  async verifyGoogleIdToken(idToken: string): Promise<CreateUserDto> {
    const ticket = await this.oAuth2Client.verifyIdToken({
      idToken,
      audience: this.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestException('Invalid ID token payload');
    }

    return {
      email: payload.email ?? '',
      firstName: payload.given_name ?? '',
      lastName: payload.family_name ?? '',
      image: payload.picture ?? '',
    };
  }

  async googleTokenLogin(token: string, request?: any) {
    try {
      let user: CreateUserDto;

      // Try to verify as ID token first (from Android/iOS apps)
      // ID tokens are JWTs that start with "eyJ"
      if (token.startsWith('eyJ')) {
        user = await this.verifyGoogleIdToken(token);
      } else {
        // Fall back to access token verification (for web clients)
        user = await this.getGoogleUserByAccessToken(token);
      }

      const existingUser = await this.findUserByEmail(user.email);

      if (!existingUser) {
        return this.registerUser(user, request);
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

  async registerUser(user: CreateUserDto, request?: any) {
    try {
      // Detect country from IP address if request is provided
      if (request && !user.country) {
        const ip = this.geolocationService.getIpFromRequest(request);
        if (ip) {
          const country = this.geolocationService.getCountryFromIp(ip);
          if (country) {
            user.country = country;
          }
        }
      }

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

  async getCurrentUser(user?: User) {
    return this.usersService.findOne(user?.id);
  }
}
