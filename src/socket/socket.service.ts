import { Injectable, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { parseKey } from 'src/utils/parse';
import { VideoParseDto } from './dto/video-parse.dto';

@Injectable()
export class SocketService {
  private logger: Logger = new Logger('SocketService');
  public server: Server;

  constructor(private readonly authService: AuthService) {}

  async msgExcludeMe(
    client: Socket,
    eventName: string,
    roomId: number,
    body?: any,
  ) {
    client.to(roomId.toString()).emit(eventName, body);
  }

  async propagate(eventName: string, roomId: number, body?: any) {
    this.server.to(roomId.toString()).emit(eventName, body);
  }

  async msgInRoom(client: Socket, roomId: number) {
    this.server.to(roomId.toString()).emit('inRoom', roomId);
  }

  async clientToKey(client: Socket): Promise<UserKeyDto> {
    const token = client.handshake.auth.token;
    this.logger.log(`clientToKey ${token}`);
    const verify = await this.authService.jwtVerify(token);
    if (!verify) return null;
    return parseKey(verify);
  }
}
