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
import { SocketService } from 'src/socket/socket.service';
import { VideoParseDto } from 'src/socket/dto/video-parse.dto';
import { RoomService } from './room.service';

@WebSocketGateway(8081, { cors: { origin: '*' } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly socketService: SocketService,
    private readonly roomService: RoomService,
  ) {}

  private logger: Logger = new Logger('websocket');

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`${client.id} sended ${data}`);
    this.socketService.server.emit('event', data);
    // return data;
  }

  afterInit(server: Server) {
    this.logger.log('웹소켓 서버 초기화 ✅');
    this.socketService.server = server;
  }

  @SubscribeMessage('updateVid')
  handleUpdateVid(
    @MessageBody() videoParseDto: VideoParseDto,
    @ConnectedSocket() client: Socket,
  ): void {
    this.roomService.updateVideoStatus(client, videoParseDto);
  }

  async handleConnection(client: Socket): Promise<void> {
    await this.roomService.onSocketLogin(client);
    return;
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.roomService.onSocketLogout(client);
    return;
  }
}
