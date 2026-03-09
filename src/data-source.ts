import { config as loadEnv } from "dotenv";
import { DataSource } from "typeorm";

// Load env (same order as NestJS ConfigModule: .local.env then .env)
loadEnv({ path: ".local.env" });
loadEnv({ path: ".env" });

import { User } from "./users/entities/user.entity";
import { FriendRequest } from "./users/entities/friend-request.entity";
import { Team } from "./teams/entities/team.entity";
import { Division } from "./teams/entities/division.entity";
import { Post } from "./teams/entities/post.entity";
import { PostReaction } from "./teams/entities/post-reaction.entity";
import { Game } from "./games/entities/game.entity";
import { Event } from "./events/entities/event.entity";
import { EventInvitation } from "./events/entities/event-invitation.entity";
import { TeamRequest } from "./team-requests/entities/team-request.entity";

export default new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    User,
    FriendRequest,
    Team,
    Division,
    Post,
    PostReaction,
    Game,
    Event,
    EventInvitation,
    TeamRequest,
  ],
  migrations: [
    __dirname +
      "/migrations/*." +
      (__filename.endsWith(".ts") ? "ts" : "js"),
  ],
  logging: process.env.NODE_ENV !== "production",
});
