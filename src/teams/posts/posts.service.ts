import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { Post } from 'src/teams/entities/post.entity';
import { Team } from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { POSTS_PAGINATION_CONFIG } from './posts.constants';
import { PostType } from './enums/post-type.enum';
import { Role } from 'src/common/enums/role.enum';
import { isAdminRole } from 'src/common/helpers/user';

const CAN_PIN_ROLES = [Role.ADMIN, Role.SUPERADMIN, Role.SUPERVISOR];

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async findAll(teamId: string, query: PaginateQuery, user: User) {
    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.team', 'team')
      .andWhere('post.teamId = :teamId', { teamId });

    const now = new Date();
    qb.andWhere('(post.dueDate IS NULL OR post.dueDate >= :now)', { now });

    return paginate(query, qb, {
      ...POSTS_PAGINATION_CONFIG,
      relations: undefined,
    });
  }

  async findOne(teamId: string, id: string, user: User): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id, team: { id: teamId } },
      relations: ['team'],
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.dueDate && new Date(post.dueDate) < new Date()) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async create(teamId: string, dto: CreatePostDto, user: User): Promise<Post> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    if (!isAdminRole(user) && user.team?.id !== teamId) {
      throw new ForbiddenException('You can only create posts for your team');
    }

    if (dto.pinned === true && !CAN_PIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only admin, superadmin or supervisor can pin posts');
    }

    const post = this.postsRepository.create({
      body: dto.body,
      type: dto.type ?? PostType.INFO,
      link: dto.link ?? null,
      pinned: dto.pinned ?? false,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      team,
    });
    return this.postsRepository.save(post);
  }

  async update(teamId: string, id: string, dto: UpdatePostDto, user: User): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id, team: { id: teamId } },
      relations: ['team'],
    });
    if (!post) throw new NotFoundException('Post not found');

    if (!isAdminRole(user) && user.team?.id !== teamId) {
      throw new ForbiddenException('You can only update posts of your team');
    }

    if (dto.pinned !== undefined && dto.pinned === true && !CAN_PIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only admin, superadmin or supervisor can pin posts');
    }

    if (dto.body !== undefined) post.body = dto.body;
    if (dto.type !== undefined) post.type = dto.type;
    if (dto.link !== undefined) post.link = dto.link;
    if (dto.pinned !== undefined) post.pinned = dto.pinned;
    if (dto.dueDate !== undefined) post.dueDate = dto.dueDate == null ? null : new Date(dto.dueDate);

    return this.postsRepository.save(post);
  }

  async remove(teamId: string, id: string, user: User): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id, team: { id: teamId } },
      relations: ['team'],
    });
    if (!post) throw new NotFoundException('Post not found');

    if (!isAdminRole(user) && user.team?.id !== teamId) {
      throw new ForbiddenException('You can only delete posts of your team');
    }

    await this.postsRepository.remove(post);
  }
}
