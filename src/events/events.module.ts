import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsMeController } from './events-me.controller';
import { Event } from './entities/event.entity';
import { EventInvitation } from './entities/event-invitation.entity';
import { User } from 'src/users/entities/user.entity';
import { Game } from 'src/games/entities/game.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { FileUploadModule } from 'src/common/modules/file-upload.module';
import { TeamsModule } from 'src/teams/teams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventInvitation, User, Game, FriendRequest]),
    AuthModule,
    UsersModule,
    FileUploadModule,
    TeamsModule,
  ],
  controllers: [EventsMeController, EventsController],
  providers: [EventsService, JwtService],
  exports: [EventsService],
})
export class EventsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
