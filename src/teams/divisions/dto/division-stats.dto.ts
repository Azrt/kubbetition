import { ApiProperty } from '@nestjs/swagger';

export class DivisionStatsDto {
  @ApiProperty({ description: 'Total completed games' })
  totalGames: number;

  @ApiProperty({ description: 'Wins' })
  wins: number;

  @ApiProperty({ description: 'Losses' })
  losses: number;

  @ApiProperty({ description: 'Draws / ties' })
  draws: number;

  @ApiProperty({ description: 'Win rate (0–1)' })
  winRate: number;

  @ApiProperty({ description: 'Total points scored' })
  pointsFor: number;

  @ApiProperty({ description: 'Total points conceded' })
  pointsAgainst: number;

  @ApiProperty({ description: 'Point differential (pointsFor - pointsAgainst)' })
  pointDifferential: number;
}
