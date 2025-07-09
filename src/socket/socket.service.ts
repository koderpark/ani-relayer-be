import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { WebSocketServer } from '@nestjs/websockets';
@Injectable()
export class SocketService {
  private logger: Logger = new Logger('SocketService');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  // async msgExcludeMe(client: Socket, eventName: string, body?: any) {
  //   const user = await this.userService.read(client.id);
  //   if (!user) return;

  //   client.to(user.roomId.toString()).emit(eventName, body);
  // }

  async msgInRoom(roomId: number, eventName: string, body?: any) {
    this.server.to(roomId.toString()).emit(eventName, body);
  }

  async roomChanged(roomId: number) {
    await this.msgInRoom(
      roomId,
      'roomChanged',
      await this.roomService.read(roomId, ['user', 'host']),
    );
  }

  async onConnection(
    client: Socket,
    type: 'host' | 'peer',
    input: {
      name?: string;
      roomName?: string;
      roomId?: number;
      password?: number;
    },
  ) {
    await this.userService.create(client.id, input.name);
    if (type == 'host') {
      await this.roomService.create(client.id, input.roomName, input.password);
    } else {
      await this.roomService.join(client.id, input.roomId, input.password);
    }

    const room = await this.roomService.readMine(client.id);
    if (!room) client.disconnect(true);

    await client.join(room.id.toString());
    await this.roomChanged(room.id);
    return room;
  }

  async onDisconnection(client: Socket): Promise<void> {
    await this.userService.remove(client.id);
    const user = await this.userService.read(client.id, ['room', 'host']);

    if (user.host) {
      await this.roomService.remove(client.id);
    } else {
      await this.roomService.leave(client.id);
    }

    await this.roomChanged(user.room.id);
  }
}
