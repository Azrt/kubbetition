import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Team } from './teams/entities/team.entity';
import { TeamSection } from './teamSections/entities/teamSection.entity';
import { Game } from "./games/entities/game.entity";
import { Score } from './scores/entities/score.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("POSTGRES_HOST"),
        port: configService.get("POSTGRES_PORT"),
        username: configService.get("POSTGRES_USER"),
        password: configService.get("POSTGRES_PASSWORD"),
        database: configService.get("POSTGRES_DB"),
        entities: [User, Team, TeamSection, Game, Score],
        synchronize: true,
        logging: true,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
