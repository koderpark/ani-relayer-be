import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Socket, Server, Namespace } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
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

  async onConnection(
    client: Socket,
    type: 'host' | 'peer',
    input: {
      name: string;
      roomId?: number;
      password?: number;
    },
  ) {
    await this.userService.create(client.id);
    if (type == 'host') {
      await this.roomService.create(client.id, input.name, input.password);
    } else {
      await this.roomService.join(client.id, input.roomId, input.password);
    }

    const room = await this.roomService.readMine(client.id);
    if (!room) client.disconnect(true);

    await client.join(room.id.toString());
    await this.msgInRoom(room.id, 'roomUpdate', room); // Todo: roomstatus
    return room;
  }

  async onDisconnection(client: Socket) {
    await this.userService.remove(client.id);
    const user = await this.userService.read(client.id, ['room', 'host']);

    if (user.host) {
      await this.roomService.remove(client.id);
    } else {
      await this.roomService.leave(client.id);
    }

    if (user.room)
      await this.msgInRoom(user.room.id, 'roomUpdate', user.room);
  }
}
