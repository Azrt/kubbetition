import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { GamesService } from "src/games/games.service";
import { ScoresService } from "../scores.service";
@Injectable()
export class GameNotReadysPipe implements PipeTransform {
  constructor(
    private gamesService: GamesService,
    private scoreService: ScoresService
  ) {}

  async transform(value: number) {
    const scores = await this.scoreService.findOne(value);
    const game = await this.gamesService.findOne(scores[0].gameId);

    if (game.scores.some(({ isReady }) => !isReady)) {
      throw new BadRequestException({
        error: "Cannot update score if game is not ready yet",
      });
    }

    return value;
  }
}
