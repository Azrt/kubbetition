import { Role } from 'src/common/enums/role.enum';
import { TeamRequest } from 'src/teamRequests/entities/team-request.entity';
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
  teamRequests: Array<TeamRequest>
}
