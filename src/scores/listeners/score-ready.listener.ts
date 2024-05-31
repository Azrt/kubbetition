import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ScoreReadyEvent } from "../events/score-ready.event";
import { GamesService } from "src/games/games.service";

export const SCORE_READY_EVENT = "score.ready";

@Injectable()
export class ScoreReadyListener {
  constructor(
    private gameService: GamesService
  ) {}

  @OnEvent('score.ready', { async: true })
  async handleScoreReadyEvent(event: ScoreReadyEvent) {
    const game = await this.gameService.findOne(event.gameId)

    if (game.isGameReady) {
      await this.gameService.startGame(event.gameId);
    }
  }
}