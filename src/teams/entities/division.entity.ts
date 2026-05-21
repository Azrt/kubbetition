import { Common } from 'src/common/entities/CommonEntity';
import { GameType } from 'src/common/enums/gameType';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { Team } from './team.entity';

@Entity()
export class Division extends Common {
  @Column({ length: 160 })
  name: string;

  @Column({
    type: 'enum',
    enum: GameType,
  })
  type: GameType;

  @ManyToOne(() => Team, (team) => team.divisions, { nullable: false, onDelete: 'CASCADE' })
  team: Team;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'division_members',
    joinColumn: { name: 'division_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'member_id', referencedColumnName: 'id' },
  })
  members: User[];
}
