import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { Post } from 'src/teams/entities/post.entity';
import { PostReaction } from 'src/teams/entities/post-reaction.entity';
import { Team } from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { POSTS_PAGINATION_CONFIG } from './posts.constants';
import { PostType } from './enums/post-type.enum';
import { ReactionType } from './enums/reaction-type.enum';
import { Role } from 'src/common/enums/role.enum';
import { isAdminRole } from 'src/common/helpers/user';
import { TeamPostsGateway } from 'src/teams/team-posts.gateway';

const CAN_PIN_ROLES = [Role.ADMIN, Role.SUPERADMIN, Role.SUPERVISOR];

const REACTION_TYPES = Object.values(ReactionType);

export type PostWithReactions = Post & {
  reactionCounts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostReaction)
    private postReactionsRepository: Repository<PostReaction>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    private readonly teamPostsGateway: TeamPostsGateway,
  ) {}

  private emptyReactionCounts(): Record<ReactionType, number> {
    return REACTION_TYPES.reduce((acc, t) => ({ ...acc, [t]: 0 }), {} as Record<ReactionType, number>);
  }

  private async getReactionCountsForPostIds(postIds: string[]): Promise<Map<string, Record<ReactionType, number>>> {
    if (postIds.length === 0) return new Map();
    const rows = await this.postReactionsRepository
      .createQueryBuilder('r')
      .select('r.postId', 'postId')
      .addSelect('r.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('r.postId IN (:...postIds)', { postIds })
      .groupBy('r.postId')
      .addGroupBy('r.type')
      .getRawMany<{ postId: string; type: ReactionType; count: string }>();

    const map = new Map<string, Record<ReactionType, number>>();
    for (const id of postIds) {
      map.set(id, this.emptyReactionCounts());
    }
    for (const row of rows) {
      const counts = map.get(row.postId)!;
      counts[row.type] = parseInt(row.count, 10);
    }
    return map;
  }

  private async getMyReactionsForPostIds(postIds: string[], userId: string): Promise<Map<string, ReactionType>> {
    if (postIds.length === 0) return new Map();
    const reactions = await this.postReactionsRepository.find({
      where: { post: { id: In(postIds) }, user: { id: userId } },
      select: ['post', 'type'],
      relations: ['post'],
    });
    return new Map(reactions.map((r) => [r.post.id, r.type]));
  }

  private enrichPostWithReactions(
    post: Post,
    reactionCounts: Record<ReactionType, number>,
    myReaction: ReactionType | null,
  ): PostWithReactions {
    return {
      ...post,
      reactionCounts,
      myReaction,
    };
  }

  async findAll(teamId: string, query: PaginateQuery, user: User) {
    const qb = this.postsRepository
      .createQueryBuilder('post')
      .andWhere('post.teamId = :teamId', { teamId });

    const now = new Date();
    qb.andWhere('(post.dueDate IS NULL OR post.dueDate >= :now)', { now });

    const result = await paginate(query, qb, {
      ...POSTS_PAGINATION_CONFIG,
      relations: undefined,
    });

    const postIds = result.data.map((p) => p.id);
    const [countsMap, myMap] = await Promise.all([
      this.getReactionCountsForPostIds(postIds),
      this.getMyReactionsForPostIds(postIds, user.id),
    ]);

    result.data = result.data.map((post) =>
      this.enrichPostWithReactions(
        post,
        countsMap.get(post.id) ?? this.emptyReactionCounts(),
        myMap.get(post.id) ?? null,
      ),
    );
    return result;
  }

  async findOne(teamId: string, id: string, user: User): Promise<PostWithReactions> {
    const post = await this.postsRepository.findOne({
      where: { id, team: { id: teamId } },
      relations: ['team'],
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.dueDate && new Date(post.dueDate) < new Date()) {
      throw new NotFoundException('Post not found');
    }

    const [countsMap, myMap] = await Promise.all([
      this.getReactionCountsForPostIds([post.id]),
      this.getMyReactionsForPostIds([post.id], user.id),
    ]);
    return this.enrichPostWithReactions(
      post,
      countsMap.get(post.id) ?? this.emptyReactionCounts(),
      myMap.get(post.id) ?? null,
    );
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
    const saved = await this.postsRepository.save(post);
    const countsMap = await this.getReactionCountsForPostIds([saved.id]);
    const payload = this.enrichPostWithReactions(
      saved,
      countsMap.get(saved.id) ?? this.emptyReactionCounts(),
      null,
    );
    this.teamPostsGateway.sendPostToTeamMembers(teamId, { post: payload as unknown as Record<string, unknown> }).catch(() => {});
    return saved;
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

    const saved = await this.postsRepository.save(post);
    const countsMap = await this.getReactionCountsForPostIds([saved.id]);
    const payload = this.enrichPostWithReactions(
      saved,
      countsMap.get(saved.id) ?? this.emptyReactionCounts(),
      null,
    );
    this.teamPostsGateway.sendPostToTeamMembers(teamId, { post: payload as unknown as Record<string, unknown> }).catch(() => {});
    return saved;
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

    const postId = post.id;
    await this.postsRepository.remove(post);
    this.teamPostsGateway.sendPostToTeamMembers(teamId, { post: { id: postId, teamId, deleted: true } }).catch(() => {});
  }

  async setReaction(teamId: string, postId: string, type: ReactionType, user: User): Promise<PostWithReactions> {
    const post = await this.postsRepository.findOne({
      where: { id: postId, team: { id: teamId } },
      relations: ['team'],
    });
    if (!post) throw new NotFoundException('Post not found');

    if (!isAdminRole(user) && user.team?.id !== teamId) {
      throw new ForbiddenException('Only team members can react to posts');
    }

    let reaction = await this.postReactionsRepository.findOne({
      where: { post: { id: postId }, user: { id: user.id } },
      relations: ['post', 'user'],
    });
    if (reaction) {
      reaction.type = type;
      await this.postReactionsRepository.save(reaction);
    } else {
      reaction = this.postReactionsRepository.create({
        post,
        user,
        type,
      });
      await this.postReactionsRepository.save(reaction);
    }

    const updated = await this.findOne(teamId, postId, user);
    const broadcastPayload = { ...updated, myReaction: null as ReactionType | null };
    this.teamPostsGateway.sendPostToTeamMembers(teamId, { post: broadcastPayload as unknown as Record<string, unknown> }).catch(() => {});
    return updated;
  }

  async removeReaction(teamId: string, postId: string, user: User): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id: postId, team: { id: teamId } },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (!isAdminRole(user) && user.team?.id !== teamId) {
      throw new ForbiddenException('Only team members can remove reactions');
    }

    await this.postReactionsRepository.delete({
      post: { id: postId },
      user: { id: user.id },
    });

    const countsMap = await this.getReactionCountsForPostIds([postId]);
    const postForEmit = await this.postsRepository.findOne({
      where: { id: postId, team: { id: teamId } },
      relations: ['team'],
    });
    if (postForEmit) {
      const payload = this.enrichPostWithReactions(
        postForEmit,
        countsMap.get(postId) ?? this.emptyReactionCounts(),
        null,
      );
      this.teamPostsGateway.sendPostToTeamMembers(teamId, { post: payload as unknown as Record<string, unknown> }).catch(() => {});
    }
  }
}
