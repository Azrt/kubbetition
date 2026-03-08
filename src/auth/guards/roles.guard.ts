import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from "src/common/decorators/roles.decorator";
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';

const matchRoles = (user: User, roles: Array<Role>) => roles.includes(user.role)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const roles = this.reflector.get(ROLES_KEY, context.getHandler());
  
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return matchRoles(user, roles);
  }
}
