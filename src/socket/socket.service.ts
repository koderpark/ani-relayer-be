import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { parseKey } from 'src/utils/parse';
import { VideoParseDto } from './dto/video-parse.dto';
import { WebSocketServer } from '@nestjs/websockets';
@Injectable()
export class SocketService {
  private logger: Logger = new Logger('SocketService');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async msgExcludeMe(client: Socket, eventName: string, body?: any) {
    const key = await this.clientToKey(client);
    const user = await this.userService.read(key);

    if (!key) return;
    if (!user) return;

    client.to(user.roomId.toString()).emit(eventName, body);
  }

  async msgInRoom(roomId: number, eventName: string, body?: any) {
    this.server.to(roomId.toString()).emit(eventName, body);
  }

  async clientToKey(client: Socket): Promise<UserKeyDto> {
    const token = client.handshake.auth.token;
    const verify = await this.authService.jwtVerify(token);

    if (!verify) return null;
    return parseKey(verify);
  }
}
