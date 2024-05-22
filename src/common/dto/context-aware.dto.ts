import { Allow } from "class-validator";
import { User } from "src/users/entities/user.entity";

export class ContextAwareDto {
  @Allow()
  context?: {
    user: User;
  };
}
