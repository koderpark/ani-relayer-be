import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Room } from 'src/room/entities/room.entity';
import { RoomService } from 'src/room/room.service';
import { SocketService } from 'src/socket/socket.service';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';
import { PartyCreateDto } from './dto/party-create.dto';
import { WebSocketServer } from '@nestjs/websockets';
import { RoomCreateDto } from 'src/room/dto/room-create.dto';

@Injectable()
export class PartyService {
  private logger: Logger = new Logger('PartyService');

  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
  ) {}

  async create(key: UserKeyDto, body: PartyCreateDto): Promise<Room> {
    this.logger.log(`create Party ${body.name}`);

    const chk = await this.roomService.readMine(key);
    if (chk) throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const fill: RoomCreateDto = {
      ownerId: key.userId,
      name: body.name,
      password: body.password,
    };

    return await this.roomService.create(key, fill);
  }

  async join(key: UserKeyDto, id: number, password?: number): Promise<Room> {
    const chk = await this.roomService.readMine(key);
    const room = await this.roomService.read(id);

    if (chk) throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);
    if (!(await this.roomService.chkPW(id, password)))
      throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);

    this.logger.log(`join Party ${id}`);

    await this.userService.update(key, { roomId: id });
    return await this.roomService.readMine(key);
  }

  async exit(key: UserKeyDto) {
    this.logger.log(`exit Room`);
    const user = await this.userService.read(key);
    await this.userService.update(key, { roomId: -1 });

    const room = await this.roomService.readMine(key);
    if (!room) return;

    if (room.ownerId == user.userId) {
      const member = await this.userService.listMember(room.id);
      if (member) {
        for (const peer of member) {
          await this.userService.update(
            { userId: peer.userId },
            { roomId: -1 },
          );
        }
      }

      await this.roomService.remove(key);
      await this.socketService.msgInRoom(
        room.id,
        'roomUpdate',
        await this.roomService.roomStatus(key),
      );
    }
  }

  async onSocketLogin(client: Socket) {
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
    await this.socketService.msgInRoom(
      room.id,
      'roomUpdate',
      await this.roomService.roomStatus(key),
    );
    return key;
  }

  async onSocketLogout(client: Socket) {
    const socketId = client.id;
    this.logger.log(`${socketId} disconnected`);

    const key = await this.socketService.clientToKey(client);
    if (!key) return;

    const room = await this.roomService.readMine(key);

    await this.exit(key);
    if (room)
      await this.socketService.msgInRoom(
        room.id,
        'roomUpdate',
        await this.roomService.roomStatus(key),
      );
  }
}
