import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { WebSocketServer } from '@nestjs/websockets';
import { Chat, Video, UserInfo } from '../interface';
import { VideoService } from '../video/video.service';
import { Room } from 'src/room/entities/room.entity';

@Injectable()
export class SocketService {
  private logger: Logger = new Logger('SocketService');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly userService: UserService,
    private readonly roomService: RoomService,
    private readonly videoService: VideoService,
  ) {}

  async msgInRoom(
    roomId: number,
    eventName: string,
    body?: any,
  ): Promise<void> {
    this.server.to(roomId.toString()).emit(eventName, body);
  }

  async msgExcludeMe(
    client: Socket,
    eventName: string,
    body?: any,
  ): Promise<void> {
    const user = await this.userService.read(client.id, ['room']);
    client.broadcast.to(user.room.id.toString()).emit(eventName, body);
  }

  async roomChanged(roomId: number) {
    this.logger.log(`roomChanged ${roomId}`);
    const info = await this.roomService.roomInfo(roomId);
    await this.msgInRoom(roomId, 'roomChanged', info);
  }

  async kick(client: Socket, userId: string) {
    try {
      const targetSocket = this.server.sockets.sockets.get(userId);
      if (!targetSocket) throw new BadRequestException('User not found');

      targetSocket.disconnect(true);
    } catch (error) {
      this.logger.error(`Failed to kick user ${userId}:`, error.message);
      throw error;
    }

    this.logger.log(`${client.id} kicked ${userId}`);
  }

  async videoPropagate(client: Socket, video: Video) {
    await this.videoService.update(client, video);
    await this.msgExcludeMe(client, 'videoChanged', video);

    this.logger.log(`${client.id} sended ${JSON.stringify(video)}`);
  }

  async chat(client: Socket, text: string) {
    const user = await this.userService.read(client.id, ['room']);
    const chat = {
      senderId: client.id,
      senderName: user.name,
      message: text,
    } satisfies Chat;

    await this.msgInRoom(user.room.id, 'chat', chat);
    this.logger.log(`${client.id} sended ${JSON.stringify(text)}`);
  }

  async chkHost(client: Socket) {
    const user = await this.userService.read(client.id, ['host']);
    if (!user.host) {
      this.logger.error(`${client.id} is not host`);
      client.disconnect(true);
    }
  }

  async handleConnection(client: Socket) {
    const { type, username } = client.handshake.auth;

    if (!['host', 'peer'].includes(type)) throw new Error('invalid_input_type');

    const user = await this.userService.create(client.id, username);
    const room = await this.roomCreate(client);
    if (!room) throw new Error('room_failed');

    await client.join(room.id.toString());
    await this.roomChanged(room.id);

    client.emit('user', {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      roomId: room.id,
      isHost: type === 'host',
    } satisfies UserInfo);

    this.logger.log(`${client.id} connected`);
  }

  async onDisconnection(client: Socket): Promise<void> {
    const user = await this.userService.read(client.id, ['room', 'host']);
    if (user.host) await this.roomService.remove(client.id);

    await this.userService.remove(client.id);
    await this.roomChanged(user.room.id);

    this.logger.log(`${client.id} disconnected`);
  }

  async roomCreate(client: Socket): Promise<Room | null> {
    const { type } = client.handshake.auth;
    if (type === 'host') {
      const { name } = client.handshake.auth;
      const password = Number(client.handshake.auth.password);
      return await this.roomService.create(client.id, name, password);
    }
    if (type === 'peer') {
      const roomId = Number(client.handshake.auth.roomId);
      const password = Number(client.handshake.auth.password);
      return await this.roomService.join(client.id, roomId, password);
    }
    return null;
  }
}