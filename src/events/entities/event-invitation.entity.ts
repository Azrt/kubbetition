import { Common } from 'src/common/entities/CommonEntity';
import { Event } from './event.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  ManyToOne,
  Index,
} from 'typeorm';

@Entity()
@Index(['event', 'user'], { unique: true })
export class EventInvitation extends Common {
  @ManyToOne(() => Event, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  event: Event;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;
}
