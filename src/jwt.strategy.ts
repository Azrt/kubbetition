import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_KEY } from './app.constants';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';

export type JwtPayload = {
  sub: string;
  email: string;
  isEmailConfirmed: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    const extractJwtFromCookie = (req) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies[AUTH_KEY];
      }
      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };

    super({
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: extractJwtFromCookie,
    });
  }

  async validate(payload: JwtPayload) {
    const id = payload.sub;
    const user = await this.userService.findOne(id);

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return {
      id: payload.sub,
      ...user,
    };
  }
}
