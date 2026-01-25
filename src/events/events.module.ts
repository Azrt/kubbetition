import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { User } from 'src/users/entities/user.entity';
import { Game } from 'src/games/entities/game.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { FileUploadModule } from 'src/common/modules/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, User, Game, FriendRequest]),
    AuthModule,
    UsersModule,
    FileUploadModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, JwtService],
  exports: [EventsService],
})
export class EventsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
