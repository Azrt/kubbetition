import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameType } from 'src/common/enums/gameType';
import { Event } from '../entities/event.entity';

export class SimpleEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty({ description: 'Total number of participants (users) across all teams' })
  participantsCount: number;

  @ApiProperty({ enum: GameType })
  gameType: GameType;

  @ApiPropertyOptional({ nullable: true })
  location: string | null;

  @ApiProperty()
  startTime: Date;

  @ApiPropertyOptional({ nullable: true })
  joiningTime: Date | null;

  @ApiPropertyOptional({ nullable: true, description: 'Presigned URL for the event image' })
  imageUrl: string | null;
}

function countParticipants(participants: Event['participants']): number {
  if (!participants || participants.length === 0) return 0;
  return participants.reduce((sum, entry) => {
    const ids = Array.isArray(entry) ? entry : entry.userIds;
    return sum + (ids?.length ?? 0);
  }, 0);
}

export function toSimpleEvent(
  event: Event,
  imageUrl: string | null = null,
): SimpleEventDto {
  return {
    id: event.id,
    createdAt: event.createdAt,
    name: event.name,
    image: event.image ?? null,
    participantsCount: countParticipants(event.participants),
    gameType: event.gameType,
    location: event.location ?? null,
    startTime: event.startTime,
    joiningTime: event.joiningTime ?? null,
    imageUrl: imageUrl ?? null,
  };
}
