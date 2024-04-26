import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { GameType } from "../enums/gameType";

@Injectable()
export class GameTypePipe implements PipeTransform {
  transform(value: GameType, metadata: ArgumentMetadata) {
    console.log({ metadata })
    if (value && !(value in GameType)) {
      throw new BadRequestException({
        error: 'Bad game type selected',
      })
    }
    
    return value
  }
}