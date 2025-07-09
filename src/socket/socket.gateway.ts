import { Logger } from '@nestjs/common';
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
import { Video } from '../room/entities/room.entity';

@WebSocketGateway(8081, { cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly socketService: SocketService) {}

  private logger: Logger = new Logger('websocket');

  afterInit(server: Server) {
    this.logger.log('웹소켓 서버 초기화 ✅');
    this.socketService.server = server;
  }

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`${client.id} sended ${data}`);
    this.socketService.server.emit('event', data);
    // return data;
  }

  @SubscribeMessage('video')
  async handleVideo(
    @MessageBody() video: Video,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.log(`${client.id} sended ${video}`);
    // this.videoService.update(client, video);
  }

  // @SubscribeMessage('updateVid')
  // handleUpdateVid(
  //   @MessageBody() videoParseDto: VideoParseDto,
  //   @ConnectedSocket() client: Socket,
  // ): void {
  //   this.logger.log(`updateVid`);
  //   this.roomService.updateVideoStatus(client, videoParseDto);
  // }

  async handleConnection(
    client: Socket,
    type: 'host' | 'peer',
    input: {
      name: string;
      roomId?: number;
      password?: number;
    },
  ): Promise<void> {
    await this.socketService.onConnection(client, type, input);
    return;
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.socketService.onDisconnection(client);
    return;
  }
}
