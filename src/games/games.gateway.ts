import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Cache } from "cache-manager";
import { Server, Socket } from "socket.io";
import { AuthService } from "src/auth/auth.service";
import { Game } from "./entities/game.entity";

@WebSocketGateway({ cors: true })
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private authService: AuthService
  ) {}

  @WebSocketServer()
  server: Server;

  public async emitGameUpdate(game: Game) {
    // const friends = await this.getFriends(activeUser.id);

    // for (const f of friends) {
    //   const user = await this.cache.get(`user ${f.id}`);

    //   if (!user) continue;

    //   const friend = user as ActiveUser;

    //   this.server.to(friend.socketId).emit("friendActive", {
    //     id: activeUser.id,
    //     isActive: activeUser.isActive,
    //   });

    //   if (activeUser.isActive) {
    //     this.server.to(activeUser.socketId).emit("friendActive", {
    //       id: friend.id,
    //       isActive: friend.isActive,
    //     });
    //   }
    // }
  }

  async handleConnection(socket: Socket) {
    const jwt = socket.handshake.headers.authorization ?? null;

    if (!jwt) {
      this.handleDisconnect(socket);
      return;
    }

    try {
      const res = await this.authService.verifyJwt(jwt);

      const { user } = res;

      socket.data.user = user;
    } catch {
      this.handleDisconnect(socket);
      return;
    }
  }

  handleDisconnect(client: any) {}
}