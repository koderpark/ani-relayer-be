import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Room } from 'src/room/entities/room.entity';
import { RoomService } from 'src/room/room.service';
import { SocketService } from 'src/socket/socket.service';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PartyService {
  private logger: Logger = new Logger('PartyService');

  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
  ) {}

  async join(key: UserKeyDto, id: number, password?: number): Promise<Room> {
    this.logger.log(`joinRoom ${id}`);

    const chk = await this.roomService.readMine(key);
    if (chk) throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const room = await this.roomService.read(id);
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);

    if ((await this.roomService.readPW(id)) != password)
      throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);

    this.logger.log(`join room ${id}`);

    await this.roomService.update(key, { cntViewer: room.cntViewer + 1 });
    await this.userService.update(key, { roomId: id });

    return await this.roomService.readMine(key);
  }

  async peers(
    key: UserKeyDto,
  ): Promise<
    { id: number; name: string; isOwner: boolean; isMe: boolean }[] | false
  > {
    this.logger.log(`peers`);

    const user = await this.userService.read(key);
    if (user.roomId == -1) return false;

    const room = await this.roomService.read(user.roomId);
    if (!room) {
      this.logger.log(`room_not_found ${user.roomId}`);
      await this.exit(key);
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);
    }

    const member = await this.userService.roomMembers(room.id);
    const peers = member.map((member) => {
      return {
        id: member.userId,
        name: member.loginId,
        isOwner: member.userId == room.ownerId,
        isMe: member.userId == key.userId,
      };
    });
    return peers;
  }

  async exit(key: UserKeyDto) {
    this.logger.log(`exit Room`);
    const user = await this.userService.read(key);
    const room = await this.roomService.readMine(key);
    if (!room) throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    await this.userService.update(key, { roomId: -1 });

    if (room.ownerId == user.userId) {
      await this.roomService.remove(room.id);
    } else {
      await this.roomService.update(key, { cntViewer: room.cntViewer - 1 });
    }
  }

  async onSocketLogin(client: Socket) {
    this.logger.log(`onSocketLogin ${client.id}`);
    const key = await this.socketService.clientToKey(client);
    if (!key) {
      this.logger.log(`invalid token ${client.id}`);
      client.disconnect();
      return;
    }

    const room = await this.roomService.readMine(key);
    if (!room) {
      this.logger.log(`already joined room ${client.id}`);
      client.disconnect();
      return;
    }

    this.logger.log(`success login ${client.id}`);
    this.logger.log(`join room ${room.id}`);
    await client.join(room.id.toString());
    await this.socketService.msgExcludeMe(client, 'roomUpdate', room.id);
    return key;
  }

  async onSocketLogout(client: Socket) {
    const socketId = client.id;
    this.logger.log(`${socketId} disconnected`);

    const key = await this.socketService.clientToKey(client);
    if (!key) return;

    const room = await this.roomService.readMine(key);
    if (!room) return;

    await this.socketService.msgExcludeMe(client, 'roomUpdate', room.id);
    await this.exit(key);
  }
}
