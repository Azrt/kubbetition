import { GameType } from "src/common/enums/gameType";
import { Team } from "src/teams/entities/team.entity";
import { User } from "src/users/entities/user.entity";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
} from "typeorm";
import { TeamSection } from "./teamSection.entity";

@Entity()
export class TeamSectionMembers {
  @PrimaryColumn({ name: 'team_section_id' })
  teamSectionId: number;

  @PrimaryColumn({ name: 'member_id'})
  memberId: number;

  @ManyToOne(() => TeamSection)
  @JoinColumn({
    name: 'team_section_id', referencedColumnName: 'id',
  })
  teamSections: Array<TeamSection>

  @ManyToMany(() => User)
  @JoinColumn({
    name: 'member_id', referencedColumnName: 'id',
  })
  members: Array<User>
}
