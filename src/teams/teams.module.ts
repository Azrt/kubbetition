import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from './entities/team.entity';
import { Division } from './entities/division.entity';
import { Post } from './entities/post.entity';
import { PostReaction } from './entities/post-reaction.entity';
import { User } from 'src/users/entities/user.entity';
import { CountryExistsRule } from 'src/common/validators/country-exists.rule';
import { CountriesService } from 'src/countries/countries.service';
import { SameTeamGuard } from 'src/common/guards/same-team.guard';
import { FileUploadModule } from 'src/common/modules/file-upload.module';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { TeamPostsGateway } from './team-posts.gateway';
import { UsersModule } from 'src/users/users.module';
import { DivisionsController } from './divisions/divisions.controller';
import { DivisionsService } from './divisions/divisions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Division, Post, PostReaction, User]),
    FileUploadModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [TeamsController, PostsController, DivisionsController],
  providers: [TeamsService, PostsService, DivisionsService, CountriesService, CountryExistsRule, SameTeamGuard, TeamPostsGateway],
  exports: [DivisionsService],
})
export class TeamsModule {}
