import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";

export const CurrentUser = createParamDecorator(
  (property: string, ectx: ExecutionContext): User => {
    const ctx = ectx.getArgByIndex(1);
    return property ? ctx.req.user && ctx.req.user[property] : ctx.req.user;
  }
);
