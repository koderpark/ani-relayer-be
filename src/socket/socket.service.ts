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

  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async onSocketLogin(client: Socket) {
    const key = await this.clientToKey(client);
    if (!key) {
      client.disconnect();
      return;
    }

    const roomId = await this.roomService.getMyRoom(key);
    if (roomId != -1) client.join(roomId.toString());
    else {
      client.disconnect();
      return;
    }

    this.logger.log(`success login ${client.id}`);
    this.logger.log(`join room ${roomId}`);
    return key;
  }

  async onSocketLogout(client: Socket) {
    const socketId = client.id;
    this.logger.log(`${socketId} disconnected`);
  }

  async updateVideoStatus(client: Socket, videoParseDto: VideoParseDto) {
    const key = await this.clientToKey(client);
    const roomId = await this.roomService.getMyRoom(key);

    const { url } = videoParseDto;

    console.log(`${roomId} updated ${JSON.stringify(videoParseDto)}`);
    this.msgExcludeMe(client, 'updateVid', videoParseDto);
    this.roomService.updateVideoMetadata(roomId, url);
  }

  async msgExcludeMe(client: Socket, eventName: string, body: any) {
    const key = await this.clientToKey(client);
    const roomId = await this.roomService.getMyRoom(key);
    client.to(roomId.toString()).emit(eventName, body);
  }

  async msgInRoom(client: Socket, server: Server) {
    const key = await this.clientToKey(client);
    const roomId = await this.roomService.getMyRoom(key);
    server.to(roomId.toString()).emit('inRoom', roomId);
  }

  async clientToKey(client: Socket): Promise<UserKeyDto> {
    const token = client.handshake.auth.token;
    const verify = await this.authService.jwtVerify(token);
    if (!verify) return null;
    return parseKey(verify);
  }
}
