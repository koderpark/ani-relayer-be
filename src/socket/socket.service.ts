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
    this.logger.log(`onSocketLogin ${client.id}`);
    const key = await this.clientToKey(client);
    if (!key) {
      client.disconnect();
      return;
    }

    const room = await this.roomService.myRoom(key);
    if (!room) {
      client.disconnect();
      return;
    }
    if (room.id != -1) client.join(room.id.toString());
    else {
      client.disconnect();
      return;
    }

    this.logger.log(`success login ${client.id}`);
    this.logger.log(`join room ${room.id}`);
    await this.msgExcludeMe(client, 'updateRoom');
    return key;
  }

  async onSocketLogout(client: Socket) {
    const socketId = client.id;
    this.logger.log(`${socketId} disconnected`);

    const key = await this.clientToKey(client);
    if (!key) return;
    await this.msgExcludeMe(client, 'updateRoom');
    await this.roomService.exit(key);
  }

  async updateVideoStatus(client: Socket, videoParseDto: VideoParseDto) {
    const key = await this.clientToKey(client);
    const room = await this.roomService.myRoom(key);
    if (!room) return;
    const { url } = videoParseDto;

    console.log(`${room.id} updated ${JSON.stringify(videoParseDto)}`);
    this.msgExcludeMe(client, 'updateVid', videoParseDto);
    this.roomService.updateVideoMetadata(room.id, url);
  }

  async msgExcludeMe(client: Socket, eventName: string, body?: any) {
    const key = await this.clientToKey(client);
    const room = await this.roomService.myRoom(key);
    if (!room) return;
    client.to(room.id.toString()).emit(eventName, body);
  }

  async msgInRoom(client: Socket, server: Server) {
    const key = await this.clientToKey(client);
    const room = await this.roomService.myRoom(key);
    if (!room) return;
    server.to(room.id.toString()).emit('inRoom', room.id);
  }

  async clientToKey(client: Socket): Promise<UserKeyDto> {
    const token = client.handshake.auth.token;
    const verify = await this.authService.jwtVerify(token);
    if (!verify) return null;
    return parseKey(verify);
  }
}
