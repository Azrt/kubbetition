import { PaginateConfig } from 'nestjs-paginate';
import { User } from './entities/user.entity';

export const USERS_PAGINATION_CONFIG: PaginateConfig<User> = {
  relations: ['team'],
  sortableColumns: ['id', 'email', 'firstName', 'lastName', 'role'],
  searchableColumns: ['email', 'firstName', 'lastName'],
  maxLimit: 50,
};
