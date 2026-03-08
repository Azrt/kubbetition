import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameType } from 'src/common/enums/gameType';
import { SimpleUserDto, toSimpleUser } from 'src/common/dto/simple-user.dto';
import { Game } from '../entities/game.entity';

export class SimpleGameDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  startTime: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endTime: Date | null;

  @ApiProperty({ enum: GameType })
  type: GameType;

  @ApiProperty()
  isCancelled: boolean;

  @ApiProperty()
  duration: number;

  @ApiPropertyOptional({ nullable: true })
  team1Score: number | null;

  @ApiProperty()
  team1Ready: boolean;

  @ApiPropertyOptional({ nullable: true })
  team2Score: number | null;

  @ApiProperty()
  team2Ready: boolean;

  @ApiPropertyOptional({ nullable: true, description: '1 = team1 won, 2 = team2 won, null = tie or not finished' })
  winner: 1 | 2 | null;

  @ApiPropertyOptional({ nullable: true })
  round: number | null;

  @ApiProperty({ type: [SimpleUserDto] })
  team1Members: SimpleUserDto[];

  @ApiProperty({ type: [SimpleUserDto] })
  team2Members: SimpleUserDto[];
}

export function toSimpleGame(game: Game): SimpleGameDto {
  return {
    id: game.id,
    createdAt: game.createdAt,
    startTime: game.startTime ?? null,
    endTime: game.endTime ?? null,
    type: game.type,
    isCancelled: game.isCancelled,
    duration: game.duration,
    team1Score: game.team1Score ?? null,
    team1Ready: game.team1Ready ?? false,
    team2Score: game.team2Score ?? null,
    team2Ready: game.team2Ready ?? false,
    winner: game.winner ?? null,
    round: game.round ?? null,
    team1Members: (game.team1Members ?? []).map(toSimpleUser),
    team2Members: (game.team2Members ?? []).map(toSimpleUser),
  };
}
