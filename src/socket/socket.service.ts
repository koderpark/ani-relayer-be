import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { WebSocketServer } from '@nestjs/websockets';
import { Video } from '../room/entities/room.entity';
import { VideoService } from '../video/video.service';

interface RoomMetadata {
  id: number;
  name: string;
  host: string;
  user: {
    id: string;
    name: string;
    isHost: boolean;
  }[];
}

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

  async roomMetadata(roomId: number): Promise<RoomMetadata | null> {
    try {
      const room = await this.roomService.read(roomId, ['users', 'host']);
      const userList = room.users
        .map((user) => ({
          id: user.id,
          name: user.name,
          isHost: user.id === room.host.id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        id: room.id,
        name: room.name,
        host: room.host.id,
        user: userList,
      };
    } catch (error) {
      return null;
    }
  }

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
    const metadata = await this.roomMetadata(roomId);
    await this.msgInRoom(roomId, 'roomChanged', metadata);
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

    console.log('checkpoint');

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
}
