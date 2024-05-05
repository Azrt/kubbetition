import { Body, ClassSerializerInterceptor, Controller, HttpStatus, Post, Res, UseInterceptors } from "@nestjs/common";
import { EmailConfirmationService } from "./emailConfirmation.service";
import { ConfirmEmailDto } from "./dto/confirm-email.dto";
import { Public } from "src/common/decorators/public.decorator";
import { ResendVerificationEmailDto } from "./dto/resend-verification-email.dto";
import { Response } from "express";

@Controller("email")
@UseInterceptors(ClassSerializerInterceptor)
export class EmailConfirmationController {
  constructor(
    private readonly emailConfirmationService: EmailConfirmationService
  ) {}

  @Public()
  @Post("verification")
  async emailVerification(
    @Body() params: ConfirmEmailDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      const email = await this.emailConfirmationService.decodeConfirmationToken(
        params.token
      );

      await this.emailConfirmationService.activateUser(email);

      res.status(HttpStatus.OK).send({ success: true })
    } catch (e) {
      res.status(HttpStatus.BAD_REQUEST).end();
    }
  }

  @Public()
  @Post("verification/resend")
  async resendEmailVerification(
    @Body() params: ResendVerificationEmailDto,
    @Res() res: Response
  ): Promise<any> {
    try {
      await this.emailConfirmationService.resendVerificationEmail(params.email);

      res.status(HttpStatus.OK).send({ success: true })
    } catch (e) {
      res.status(HttpStatus.BAD_REQUEST).json(e);
    }
  }
}
