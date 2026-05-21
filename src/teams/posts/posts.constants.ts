import { PaginateConfig } from 'nestjs-paginate';
import { Post } from 'src/teams/entities/post.entity';

export const POSTS_PAGINATION_CONFIG: PaginateConfig<Post> = {
  relations: ['team'],
  sortableColumns: ['id', 'createdAt', 'dueDate', 'pinned'],
  defaultSortBy: [['pinned', 'DESC'], ['createdAt', 'DESC']],
  maxLimit: 50,
};
