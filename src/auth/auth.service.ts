import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { google, Auth } from 'googleapis';

@Injectable()
export class AuthService {
  private oauthClient: Auth.OAuth2Client;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const clientID = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_SECRET');

    this.oauthClient = new google.auth.OAuth2(clientID, clientSecret);
  }

  generateJwt(payload) {
    return this.jwtService.sign(payload);
  }

  async signIn(user) {
    if (!user) {
      throw new BadRequestException('Unauthenticated');
    }

    const userExists = await this.findUserByEmail(user.email);

    if (!userExists) {
      return this.registerUser(user);
    }

    return this.generateJwt({
      sub: userExists.id,
      email: userExists.email,
    });
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new BadRequestException('No user from google');
    }

    const user = {
      ...req.user,
      image: req.user.picture,
    };

    return user;
  }

  async googleTokenLogin(idToken: string) {
    const tokenInfo = await this.oauthClient.getTokenInfo(idToken);

    const userExists = await this.findUserByEmail(tokenInfo.email);

    if (!userExists) {
      return this.registerUser(userExists);
    }

    return userExists;
  }

  async registerUser(user: CreateUserDto) {
    try {
      const newUser = await this.usersService.create(user);

      return newUser;
    } catch {
      throw new InternalServerErrorException();
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
