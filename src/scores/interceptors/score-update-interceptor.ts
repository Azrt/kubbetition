import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable, tap } from "rxjs";
import { Game } from "src/games/entities/game.entity";
import { Repository } from "typeorm";
import { Score } from "../entities/score.entity";

// Sets game winner after score update
@Injectable()
export class ScoreUpdateInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(async (data) => {
        const gameScores = await this.scoreRepository.find({
          relations: ["teamSection"],
          where: {
            gameId: data?.gameId,
          }
        })

        // Both scores must be filled
        if (gameScores?.every(({ score }) => typeof score === "number")) {
          const winningScore = gameScores.reduce<Score | null>(
            (accumulator, current) => {
              if (current.score && current.score > (accumulator?.score ?? 0)) {
                return current;
              }

              return accumulator;
            },
            null
          );

          await this.gamesRepository.save({
            id: data.gameId,
            winner: winningScore?.teamSection ?? null,
          });
        }

        return data;
      })
    );
  }
}
