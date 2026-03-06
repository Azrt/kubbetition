import { Common } from 'src/common/entities/CommonEntity';
import { Team } from 'src/teams/entities/team.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { PostType } from '../posts/enums/post-type.enum';

@Entity()
export class Post extends Common {
  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.INFO,
  })
  type: PostType;

  @Column({ length: 2048, nullable: true })
  link: string | null;

  @Column({ default: false })
  pinned: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @ManyToOne(() => Team, (team) => team.posts, { nullable: false, onDelete: 'CASCADE' })
  team: Team;
}
