import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';

export class RankingEntryDto {
  @ApiProperty({ description: 'User information' })
  user: User;

  @ApiProperty({ description: 'Total points gained (pointsFor - sum of all points scored in games)' })
  points: number;

  @ApiProperty({ description: 'Number of wins' })
  wins: number;

  @ApiProperty({ description: 'Number of draws' })
  draws: number;

  @ApiProperty({ description: 'Number of losses' })
  losses: number;

  @ApiProperty({ description: 'Sum of opponents strength (Swiss-system tiebreaker)' })
  opponentsStrength: number;

  @ApiProperty({ description: 'Points achieved (scored)' })
  pointsFor: number;

  @ApiProperty({ description: 'Points lost (conceded)' })
  pointsAgainst: number;
}
