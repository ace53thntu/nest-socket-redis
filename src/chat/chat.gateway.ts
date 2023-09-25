import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  GatewayMetadata,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { CacheService } from '../cache/cache.service';

@WebSocketGateway<GatewayMetadata>({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Namespace;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly cacheService: CacheService) {}

  afterInit() {
    this.logger.log(`💬 Websocket Gateway initialized ${this.server.name}`);
  }

  async handleConnection(client: Socket) {
    this.logger.log(
      `🔗 Client connected with transport ${client.conn.transport.name} and ID: ${client.id}`,
    );

    const users = await this.cacheService.list();

    // Tell the socket how many users are present.
    return this.server
      .to(client.id)
      .emit('presence', { numUsers: users.length });
  }

  async handleDisconnect(client: Socket) {
    this.cacheService.remove(client.id);
    const users = await this.cacheService.list();
    this.server.emit('user left', {
      numUsers: users.length,
    });
    this.disconnect(client);
  }

  private disconnect(client: Socket) {
    client.disconnect();
    this.logger.log(`🔗 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('anonymous user')
  async anonymousUser(
    @MessageBody() data: { username: string },
    @ConnectedSocket() _client: Socket,
  ): Promise<any> {
    this.logger.log(`💬 Websocket Gateway identity: ${JSON.stringify(data)}`);
    this.cacheService.upsert(_client.id, {
      username: data.username,
    });
    const users = await this.cacheService.list();
    return this.server.emit('user joined', {
      username: data.username,
      numUsers: users.length,
    });
  }
}
