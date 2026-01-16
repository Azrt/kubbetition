import { Exclude } from 'class-transformer';
import { Role } from 'src/common/enums/role.enum';
import { Game } from 'src/games/entities/game.entity';
import { TeamRequest } from 'src/team-requests/entities/team-request.entity';
import { FriendRequest } from './friend-request.entity';
import { Team } from 'src/teams/entities/team.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ length: 250, unique: true })
  @Index("user_email_idx")
  public email: string;

  @Column({ length: 160 })
  firstName: string;

  @Column({ length: 160 })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  // TODO: Update when there will be different type of user registration
  @Column({ default: true })
  isEmailConfirmed: boolean;

  @Column({ nullable: true, length: 450 })
  image: string;

  @Column({ length: 2, nullable: true })
  country: string;

  @Column({ length: 1000, nullable: true })
  @Exclude({ toPlainOnly: true })
  mobileToken: string;

  @ManyToOne(() => Team, (team) => team.members, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  team: Team | null;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @OneToMany(() => TeamRequest, (request) => request.user, {
    nullable: true,
    cascade: true,
  })
  teamRequests: Array<TeamRequest>;

  @OneToMany(() => FriendRequest, (request) => request.requester, {
    nullable: true,
    cascade: true,
  })
  sentFriendRequests: Array<FriendRequest>;

  @OneToMany(() => FriendRequest, (request) => request.recipient, {
    nullable: true,
    cascade: true,
  })
  receivedFriendRequests: Array<FriendRequest>;

  @OneToMany(() => Game, (game) => game.createdBy)
  createdGames: Array<Game>;

  constructor(entity: Partial<User>) {
    Object.assign(this, entity);
  }
}
