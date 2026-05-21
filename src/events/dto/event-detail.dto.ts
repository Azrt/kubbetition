import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameType } from 'src/common/enums/gameType';
import { SimpleUserDto, toSimpleUser } from 'src/common/dto/simple-user.dto';
import { Event } from '../entities/event.entity';
import { EventMode } from '../enums/event-mode.enum';

export class EventDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty()
  details: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ enum: GameType })
  gameType: GameType;

  @ApiProperty()
  rounds: number;

  @ApiProperty()
  currentRound: number;

  @ApiPropertyOptional({ nullable: true })
  location: string | null;

  @ApiPropertyOptional({ nullable: true })
  roundDuration: number | null;

  @ApiProperty({ enum: EventMode })
  mode: EventMode;

  @ApiPropertyOptional({ nullable: true })
  participantLimit: number | null;

  @ApiPropertyOptional({ nullable: true })
  endTime: Date | null;

  @ApiPropertyOptional({ nullable: true })
  joiningTime: Date | null;

  @ApiProperty()
  startTime: Date;

  @ApiProperty({ type: () => SimpleUserDto })
  createdBy: SimpleUserDto;

  @ApiPropertyOptional({ nullable: true, description: 'Presigned URL for the event image' })
  imageUrl: string | null;
}

export function toEventDetail(
  event: Event,
  imageUrl: string | null,
): EventDetailDto {
  return {
    id: event.id,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    name: event.name,
    image: event.image ?? null,
    details: event.details,
    isPublic: event.isPublic,
    gameType: event.gameType,
    rounds: event.rounds,
    currentRound: event.currentRound ?? 0,
    location: event.location ?? null,
    roundDuration: event.roundDuration ?? null,
    mode: event.mode,
    participantLimit: event.participantLimit ?? null,
    endTime: event.endTime ?? null,
    joiningTime: event.joiningTime ?? null,
    startTime: event.startTime,
    createdBy: toSimpleUser(event.createdBy),
    imageUrl: imageUrl ?? null,
  };
}
