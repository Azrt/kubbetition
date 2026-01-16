import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { Socket, Event } from 'socket.io';
import { JwtPayload, JwtStrategy } from "src/jwt.strategy";

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (
  jwtService: JwtService,
  configService: ConfigService,
  userService: UsersService
): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token ?? socket.handshake.headers?.token;

      if (!token) {
        throw new Error("Authorization token is missing");
      }

      let payload: JwtPayload | null = null;

      try {
        payload = await jwtService.verifyAsync<JwtPayload>(token, {
          secret: configService.get("JWT_SECRET"),
        });
      } catch (error) {
        throw new Error("Authorization token is invalid");
      }

      const strategy = new JwtStrategy(configService, userService);
      const user = await strategy.validate(payload);

      if (!user) {
        throw new Error("User does not exist");
      }

      socket = Object.assign(socket, {
        user: user!,
      });

      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  };
};
