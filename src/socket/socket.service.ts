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
import { Chat, Video } from '../interface';
import { VideoService } from '../video/video.service';

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

  async onHostConnection(
    client: Socket,
    input: {
      username: string;
      name: string;
      password: number;
    },
  ) {
    const user = await this.userService.create(client.id, input.username);

    const room = await this.roomService.create(
      user.id,
      input.name,
      input.password,
    );

    await client.join(room.id.toString());
    await this.roomChanged(room.id);
    return room;
  }

  async onPeerConnection(
    client: Socket,
    input: {
      username: string;
      roomId: number;
      password?: number;
    },
  ) {
    const user = await this.userService.create(client.id, input.username);
    const room = await this.roomService.join(
      user.id,
      input.roomId,
      input.password,
    );

    await client.join(room.id.toString());
    await this.roomChanged(room.id);
    return room;
  }

  async onDisconnection(client: Socket): Promise<void> {
    const user = await this.userService.read(client.id, ['room', 'host']);

    if (user.host) await this.roomService.remove(client.id);

    await this.userService.remove(client.id);

    if (user.room) await this.roomChanged(user.room.id);
  }

  async kick(client: Socket, userId: string) {
    try {
      const targetSocket = this.server.sockets.sockets.get(userId);

      if (!targetSocket) {
        throw new BadRequestException('User not found');
      }

      targetSocket.disconnect(true);

      this.logger.log(`User ${userId} has been kicked`);
    } catch (error) {
      this.logger.error(`Failed to kick user ${userId}:`, error.message);
      throw error;
    }
  }

  async videoChanged(client: Socket, video: Video) {
    this.logger.log(`videoChanged service`);

    const user = await this.userService.read(client.id, ['room', 'host']);
    if (!user.host) {
      this.logger.log(`${JSON.stringify(user)} is not host`);
      return;
    }

    await this.videoService.update(client, video);
    await this.msgExcludeMe(client, 'videoChanged', video);
  }

  async chat(client: Socket, message: string) {
    const user = await this.userService.read(client.id, ['room', 'host']);
    const chat = {
      senderId: client.id,
      senderName: user.name,
      message,
    } satisfies Chat;

    await this.msgInRoom(user.room.id, 'chat', chat);
  }

  async chkHost(client: Socket) {
    const user = await this.userService.read(client.id, ['host']);
    if (!user.host) {
      this.logger.error(`${client.id} is not host`);
      client.disconnect(true);
    }
  }
}
