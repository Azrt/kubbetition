import { Common } from 'src/common/entities/CommonEntity';
import { Division } from './division.entity';
import { Post } from './post.entity';
import { TeamRequest } from 'src/team-requests/entities/team-request.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity()
export class Team extends Common {
  @Column({ length: 160 })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 2, nullable: true })
  country: string;

  @Column({ nullable: true, length: 450 })
  details: string;

  @Column({ nullable: true, length: 450 })
  logo: string;

  @OneToMany(() => Division, (division) => division.team, {
    nullable: true,
    cascade: true,
  })
  divisions: Division[];

  @OneToMany(() => User, (user) => user.team, {
    nullable: true,
    cascade: true,
  })
  members: Array<User>;

  @OneToMany(() => TeamRequest, (request) => request.user, {
    nullable: true,
    cascade: true,
  })
  teamRequests: Array<TeamRequest>;

  @OneToMany(() => Post, (post) => post.team, {
    nullable: true,
    cascade: true,
  })
  posts: Array<Post>;

  @ManyToOne(() => User, {
    nullable: false,
  })
  createdBy: User;
}
