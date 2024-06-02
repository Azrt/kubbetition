import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";

export const CurrentUser = createParamDecorator(
  (property: string, ectx: ExecutionContext): User => {
    const ctx = ectx.getArgByIndex(1);

    return ctx.req.user;
  }
);
