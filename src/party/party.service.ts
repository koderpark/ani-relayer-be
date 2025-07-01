import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Room } from 'src/room/entities/room.entity';
import { RoomService } from 'src/room/room.service';
import { SocketService } from 'src/socket/socket.service';
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

  async create(socketId: string, body: PartyCreateDto): Promise<Room> {
    this.logger.log(`create Party ${body.name}`);

    const user = await this.userService.read(socketId);
    const room = await this.roomService.readMine(socketId);
    if (room)
      throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const fill: RoomCreateDto = {
      ownerId: user.userId,
      name: body.name,
      password: body.password,
    };

    return await this.roomService.create(socketId, fill);
  }

  async join(socketId: string, id: number, password?: number): Promise<Room> {
    const chk = await this.roomService.readMine(socketId);
    const room = await this.roomService.read(id);

    if (chk) throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);
    if (!(await this.roomService.chkPW(id, password)))
      throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);

    this.logger.log(`join Party ${id}`);

    await this.userService.update(socketId, { roomId: id });
    return await this.roomService.readMine(socketId);
  }

  async exit(socketId: string) {
    this.logger.log(`exit Room`);
    const user = await this.userService.read(socketId);
    await this.userService.update(socketId, { roomId: -1 });

    const room = await this.roomService.readMine(socketId);
    if (!room) return;

    if (room.ownerId == user.userId) {
      const member = await this.userService.listMember(room.id);
      if (member) {
        for (const peer of member) {
          await this.userService.update(peer.socketId, { roomId: -1 });
        }
      }

      await this.roomService.remove(socketId);
      await this.socketService.msgInRoom(
        room.id,
        'roomUpdate',
        await this.roomService.roomStatus(socketId),
      );
    }
  }

  async onSocketLogin(client: Socket) {
    const user = await this.userService.read(client.id);
    if (!user) {
      this.logger.log(`invalid token ${client.id}`);
      client.disconnect();
      return;
    }

    const room = await this.roomService.readMine(client.id);
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
      await this.roomService.roomStatus(client.id),
    );
    return client.id;
  }

  async onSocketLogout(client: Socket) {
    const socketId = client.id;
    this.logger.log(`${socketId} disconnected`);

    const user = await this.userService.read(client.id);
    if (!user) return;

    const room = await this.roomService.readMine(client.id);

    await this.exit(client.id);
    if (room)
      await this.socketService.msgInRoom(
        room.id,
        'roomUpdate',
        await this.roomService.roomStatus(client.id),
      );
  }
}
