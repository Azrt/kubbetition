import { ApiProperty } from "@nestjs/swagger";
import { Game } from "../entities/game.entity";

export class GamesSummaryStatsDto {
  @ApiProperty({ description: "Total number of completed games against this opponent group" })
  totalGames: number;

  @ApiProperty({ description: "Number of games you won" })
  wins: number;

  @ApiProperty({ description: "Number of games you lost" })
  losses: number;

  @ApiProperty({ description: "Number of draws" })
  draws: number;

  @ApiProperty({ description: "Win rate (0–100). Wins / totalGames when totalGames > 0" })
  winRate: number;
}

export class GamesSummaryResponseDto {
  @ApiProperty({ type: GamesSummaryStatsDto, description: "Aggregate statistics" })
  summary: GamesSummaryStatsDto;

  @ApiProperty({ type: [Object], description: "List of games (most recent first)" })
  games: Game[];
}
