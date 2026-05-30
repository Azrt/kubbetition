import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GamesService } from './games.service';

@Injectable()
export class GamesSchedulerService {
  private readonly logger = new Logger(GamesSchedulerService.name);

  constructor(private readonly gamesService: GamesService) {}

  /**
   * Every hour: close ad-hoc games that started more than 1 hour ago and were not finished.
   * Sets score 0 for teams that did not submit, then ends the games.
   * Event games are skipped — they are ended via end-round or when the event ends.
   */
  @Cron('0 * * * *') // At minute 0 of every hour
  async handleStaleGamesClosure() {
    try {
      const closedCount = await this.gamesService.closeStaleUnfinishedGames();
      if (closedCount > 0) {
        this.logger.log(`Auto-closed ${closedCount} stale game(s).`);
      }
    } catch (error) {
      this.logger.error('Failed to close stale games', error);
    }
  }
}
