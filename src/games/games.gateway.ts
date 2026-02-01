import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthWsMiddleware } from 'src/common/middleware/authWs.middleware';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Game } from './entities/game.entity';

interface ExtendedSocket extends Socket {
  user: User;
}

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "games",
})
export class GamesGateway
  implements
    OnGatewayInit,
    OnGatewayConnection<ExtendedSocket>,
    OnGatewayDisconnect<ExtendedSocket>
{
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService
  ) {}

  private readonly logger = new Logger(GamesGateway.name);
  private readonly connectedClients = new Map<string, ExtendedSocket>();

  @WebSocketServer() io: Server;

  afterInit(@ConnectedSocket() socket: Socket) {
    socket.use(
      // @ts-ignore
      AuthWsMiddleware(this.jwtService, this.configService, this.userService)
    );
  }

  handleConnection(client: ExtendedSocket, ...args: any[]) {
    this.connectedClients.set(client.user.id, client);

    this.logger.log(`Client id: ${client.id} connected`);
  }

  handleDisconnect(client: ExtendedSocket) {
    this.connectedClients.delete(client.user.id);
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  sendGameDataToClients(game: Game) {
    const members = game.allMembers?.map(({ id }) => id) ?? [];

    members.forEach((client) => {
      const socket = this.connectedClients.get(client);

      if (socket) {
        socket.emit("gameUpdated", game);
      }
    });
  }
}
