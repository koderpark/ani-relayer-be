import { BadRequestException, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { UserService } from '../user/user.service';
import { UserInfo, Video } from '../interface';

@WebSocketGateway(0, { cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly socketService: SocketService) {}

  private logger: Logger = new Logger('websocket');

  afterInit(server: Server) {
    this.logger.log('웹소켓 서버 초기화 ✅');
    this.socketService.server = server;
  }

  @SubscribeMessage('video')
  handleVideo(@MessageBody() video: Video, @ConnectedSocket() client: Socket) {
    this.socketService.handleVideo(client, video);
  }

  @SubscribeMessage('chat')
  handleChat(@MessageBody() text: string, @ConnectedSocket() client: Socket) {
    this.socketService.chat(client, text);
  }

  @SubscribeMessage('room/kick')
  async handleRoomKick(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.socketService.chkHost(client);
    this.socketService.handleRoomKick(client, data.userId);
  }

  async handleConnection(client: Socket) {
    this.socketService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    this.socketService.onDisconnection(client);
  }
}
