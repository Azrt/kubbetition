import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import EmailService from "../email/email.service";
import { UsersService } from "src/users/users.service";

interface VerificationTokenPayload {
  email: string;
}

@Injectable()
export class EmailConfirmationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService
  ) {}

  async activateUser(email: string) {
    const user = await this.usersService.findOneByEmail(email);
  
    if (user.isEmailConfirmed) {
      throw new BadRequestException("Email already activated");
    }
  
    return this.usersService.confirmEmail(email)
  }

  async resendVerificationEmail(email: string) {
    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      await this.sendVerificationLink(email);
    }

    return true;
  }

  // TODO: Update mail message, update resend link message
  public sendVerificationLink(email: string) {
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_SECRET"),
      expiresIn: `${this.configService.get("JWT_EMAIL_EXPIRATION_TIME")}s`,
    });

    const url = `${this.configService.get("EMAIL_CONFIRMATION_URL")}?token=${token}`;

    const text = `Welcome to the application. To confirm the email address, click here: ${url}`;

    return this.emailService.sendMail({
      to: email,
      subject: "Email confirmation",
      text,
    });
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET"),
      });

      if (typeof payload === "object" && "email" in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === "TokenExpiredError") {
        throw new BadRequestException("Email confirmation token expired");
      }
      throw new BadRequestException("Bad confirmation token");
    }
  }
}
