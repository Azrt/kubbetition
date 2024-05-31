import { Injectable } from "@nestjs/common";
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { GamesService } from "src/games/games.service";
import { ScoresService } from "../scores.service";
import { User } from "src/users/entities/user.entity";

@ValidatorConstraint({ async: true, name: "CanJoinGame" })
@Injectable()
export class CanJoinGameRule implements ValidatorConstraintInterface {
  constructor(
    private gamesService: GamesService,
    private scoreService: ScoresService
  ) {}

  async validate(id: string, validationArguments: ValidationArguments) {
    const user = (validationArguments.object as Record<string, any>)?.context?.user as User;

    const score = await this.scoreService.findOne(+id);
    const game = await this.gamesService.findOne(score?.gameId);

    const gameHasMember = game.members.some(({ id }) => id === user?.id);
    const userAlreadyJoined = game.scores.some(({ members }) =>
      members.some(({ id }) => id === user?.id)
    );

    return gameHasMember && !userAlreadyJoined;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return "User already joined game or cannot join";
  }
}
