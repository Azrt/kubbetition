import { Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      next();
    } else {
      const token = req.headers.authorization.replace("Bearer", "").trim();

      const verify = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET"),
      });

      if (verify?.email) {
        const user = await this.authService.findUserByEmail(verify.email);

        if (user) {
          req.body.user = user;
        }
      }
    }
    next();
  }
}
