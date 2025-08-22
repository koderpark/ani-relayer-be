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
import { Video } from '../room/entities/room.entity';

@WebSocketGateway(0, { cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly socketService: SocketService,
    private readonly userService: UserService,
  ) {}

  private logger: Logger = new Logger('websocket');

  afterInit(server: Server) {
    this.logger.log('웹소켓 서버 초기화 ✅');
    this.socketService.server = server;
  }

  @SubscribeMessage('video')
  async handleVideo(
    @MessageBody() video: Video,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.socketService.chkHost(client);
    await this.socketService.videoChanged(client, video);

    this.logger.log(`${client.id} sended ${JSON.stringify(video)}`);
  }

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() text: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.socketService.chat(client, text);

    this.logger.log(`${client.id} sended ${JSON.stringify(text)}`);
  }

  @SubscribeMessage('room/kick')
  async handleRoomKick(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.socketService.chkHost(client);
    await this.socketService.kick(client, data.userId);

    this.logger.log(`${client.id} kicked ${data.userId}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    const { type } = client.handshake.auth;

    this.logger.log(`${client.id} connected`);

    try {
      if (type === 'host') await this.handleHostConnection(client);
      else if (type === 'peer') await this.handlePeerConnection(client);
      else throw new BadRequestException('invalid_input_type');

      const me = await this.userService.read(client.id, ['room', 'host']);
      client.emit('user', {
        id: me.id,
        name: me.name,
        createdAt: me.createdAt,
        roomId: me.room ? me.room.id : null,
        isHost: !!me.host,
      });
    } catch (error) {
      this.logger.error(error);
      client.disconnect();
    }

    return;
  }

  async handleHostConnection(client: Socket): Promise<void> {
    const { username, name, password } = client.handshake.auth;

    console.log('handleHostConnection', username, name, password);

    await this.socketService.onHostConnection(client, {
      username: username as string,
      name: name as string,
      password: password ? Number(password) : undefined,
    });
  }

  async handlePeerConnection(client: Socket): Promise<void> {
    const { username, roomId, password } = client.handshake.auth;

    console.log('handlePeerConnection', username, roomId, password);

    await this.socketService.onPeerConnection(client, {
      username: username as string,
      roomId: Number(roomId),
      password: password ? Number(password) : undefined,
    });
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`${client.id} disconnected`);
    await this.socketService.onDisconnection(client);
    return;
  }
}
