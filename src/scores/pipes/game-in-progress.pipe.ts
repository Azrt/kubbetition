import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { GamesService } from "src/games/games.service";
@Injectable()
export class GameInProgressPipe implements PipeTransform {
  constructor(private gamesService: GamesService) {}

  async transform(value: number) {
    const game = await this.gamesService.findOneByScore(value)

    if (game?.endTime) {
      throw new BadRequestException({
        error: "Cannot update finished game score",
      });
    }

    return value;
  }
}
