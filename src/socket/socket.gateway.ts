import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';

@WebSocketGateway(8081, { cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly socketService: SocketService) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('websocket');

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`${client.id} sended ${data}`);
    this.server.emit('event', data);
    // return data;
  }

  afterInit(server: Server) {
    this.logger.log('웹소켓 서버 초기화 ✅');
  }

  async handleConnection(client: Socket): Promise<void> {
    await this.socketService.onSocketLogin(client);
    return;
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.socketService.onSocketLogout(client);
    return;
  }
}
