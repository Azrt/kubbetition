import { Common } from 'src/common/entities/CommonEntity';
import { Post } from './post.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { ReactionType } from '../posts/enums/reaction-type.enum';

@Entity()
@Unique(['post', 'user'])
export class PostReaction extends Common {
  @ManyToOne(() => Post, (post) => post.reactions, { nullable: false, onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  type: ReactionType;
}
