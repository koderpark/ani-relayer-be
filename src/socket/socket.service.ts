import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { WebSocketServer } from '@nestjs/websockets';

interface RoomMetadata {
  id: number;
  name: string;
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
  ) {}

  async roomMetadata(roomId: number): Promise<RoomMetadata | null> {
    try {
      const room = await this.roomService.read(roomId, ['users', 'host']);
      return {
        id: room.id,
        name: room.name,
        user: room.users.map((user) => ({
          id: user.id,
          name: user.name,
          isHost: room.host?.id === user.id,
        })),
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

  async roomChanged(roomId: number) {
    const metadata = await this.roomMetadata(roomId);
    this.logger.log(`roomChanged ${JSON.stringify(metadata)}`);
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
      password: number;
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

    if (user.host) {
      await this.roomService.remove(client.id);
    } else {
      await this.roomService.leave(client.id);
    }

    await this.userService.remove(client.id);
    await this.roomChanged(user.room.id);
  }
} 
