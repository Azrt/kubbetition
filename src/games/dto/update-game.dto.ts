import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateGameDto } from './create-game.dto';
import { IsDate } from 'class-validator';

export class UpdateGameDto extends PartialType(CreateGameDto) {
  @ApiProperty()
  @IsDate()
  endTime: Date;
}
