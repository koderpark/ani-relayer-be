import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server, Namespace } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import { WebSocketServer } from '@nestjs/websockets';
@Injectable()
export class SocketService {
  private logger: Logger = new Logger('SocketService');

  @WebSocketServer()
  server: Server;

  constructor(private readonly userService: UserService) {}

  // async msgExcludeMe(client: Socket, eventName: string, body?: any) {
  //   const user = await this.userService.read(client.id);
  //   if (!user) return;

  //   client.to(user.roomId.toString()).emit(eventName, body);
  // }

  // async msgInRoom(roomId: number, eventName: string, body?: any) {
  //   this.server.to(roomId.toString()).emit(eventName, body);
  // }

  async onConnection(client: Socket) {
    await this.userService.create(client.id);
  }

  async onDisconnection(client: Socket) {
    await this.userService.remove(client.id);
  }
}
