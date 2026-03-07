import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthWsMiddleware } from 'src/common/middleware/authWs.middleware';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { TeamsService } from 'src/teams/teams.service';

export type PostUpdatedPayload =
  | { post: Record<string, unknown>; deleted?: false }
  | { post: { id: string; teamId: string; deleted: true } };

interface ExtendedSocket extends Socket {
  user: User;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'team-posts',
})
export class TeamPostsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection<ExtendedSocket>,
    OnGatewayDisconnect<ExtendedSocket>
{
  private readonly logger = new Logger(TeamPostsGateway.name);
  private readonly connectedClients = new Map<string, ExtendedSocket>();

  @WebSocketServer() io: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly teamsService: TeamsService,
  ) {}

  afterInit(socket: Socket) {
    socket.use(
      // @ts-ignore
      AuthWsMiddleware(this.jwtService, this.configService, this.userService),
    );
  }

  handleConnection(client: ExtendedSocket) {
    this.connectedClients.set(client.user.id, client);
    this.logger.log(`Client id: ${client.id} connected (user: ${client.user.id})`);
  }

  handleDisconnect(client: ExtendedSocket) {
    this.connectedClients.delete(client.user.id);
    this.logger.log(`Client id: ${client.id} disconnected`);
  }

  async sendPostToTeamMembers(teamId: string, payload: PostUpdatedPayload): Promise<void> {
    const team = await this.teamsService.findOne(teamId);
    if (!team?.members?.length) return;

    const memberIds = team.members.map((m) => m.id);

    for (const userId of memberIds) {
      const socket = this.connectedClients.get(userId);
      if (socket) {
        socket.emit('postUpdated', payload);
      }
    }
  }
}
