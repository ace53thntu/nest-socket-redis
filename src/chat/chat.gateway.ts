import { Logger } from '@nestjs/common';
import {
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

  afterInit() {
    this.logger.log(`💬 Websocket Gateway initialized ${this.server.name}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected`);

    return this.server.emit('onlineUsers', 10);
  }

  handleDisconnect(client: Socket) {
    this.disconnect(client);
  }

  private disconnect(client: Socket) {
    client.disconnect();
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    this.logger.log(`💬 Websocket Gateway identity: ${JSON.stringify(data)}`);
    return data;
  }
}
