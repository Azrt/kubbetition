import { Common } from 'src/common/entities/CommonEntity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';

@Entity()
export class Team extends Common {
  @Column({ length: 160 })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, length: 450 })
  image: string;

  @OneToMany(() => User, (user) => user.team, {
    nullable: true,
  })
  members: Array<User>;
}
