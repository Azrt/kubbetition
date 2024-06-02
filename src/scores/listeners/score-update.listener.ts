import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GamesService } from "src/games/games.service";
import { ScoreUpdateEvent } from "../events/score-update.event";

export const SCORE_UPDATE_EVENT = 'score.update'

@Injectable()
export class ScoreUpdateListener {
  constructor(private gameService: GamesService) {}

  @OnEvent(SCORE_UPDATE_EVENT, { async: true })
  async handleScoreUpdateEvent(event: ScoreUpdateEvent) {
    const game = await this.gameService.findOne(event.gameId);

    if (game.scores.every(({ value }) => typeof value === "number")) {
      await this.gameService.endGame(event.gameId);
    }
  }
}
