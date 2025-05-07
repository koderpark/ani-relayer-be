import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RoomCreateDto } from './dto/room-create.dto';
import { RoomUpdateDto } from './dto/room-update.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomQueryDto } from './dto/room-query.dto';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';
import { RoomRespDto } from './dto/room-resp.dto';
import { RoomVideoDto } from './dto/room-video.dto';
import { SocketService } from 'src/socket/socket.service';
import { Socket } from 'socket.io';
import { VideoParseDto } from 'src/socket/dto/video-parse.dto';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
  ) {}

  async create(key: UserKeyDto, body: RoomCreateDto): Promise<Room> {
    this.logger.log(`create Room ${body.name}`);

    const chk = await this.readMine(key);
    if (chk) throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const fill = {
      ownerId: key.userId,
      cntViewer: 1,
      name: body.name,
      password: body.password,
    };

    const room = this.roomRepository.create(fill);
    await this.roomRepository.save(room);

    await this.userService.update(key, { roomId: room.id });
    return room;
  }

  async read(id: number): Promise<Room> {
    this.logger.log(`read Room ${id}`);
    return await this.roomRepository.findOneBy({ id });
  }

  async readAll(): Promise<Room[]> {
    this.logger.log(`readAll`);
    return await this.roomRepository.find();
  }

  async readPW(id: number): Promise<number> {
    this.logger.log(`readPW`);
    const chk = await this.read(id);
    if (!chk) throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    const room = await this.roomRepository.findOne({
      where: { id: chk.id },
      select: ['id', 'password'],
    });
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);

    return room.password;
  }

  async readMine(key: UserKeyDto): Promise<Room> {
    this.logger.log(`readMine`);

    const user = await this.userService.read(key);
    if (user.roomId == -1) return null;

    return await this.read(user.roomId);
  }

  async update(key: UserKeyDto, data: RoomUpdateDto): Promise<boolean> {
    const room = await this.readMine(key);
    if (!room) return false;

    const res = await this.roomRepository.update(room.id, data);
    return res.affected ? true : false;
  }

  async remove(id: number): Promise<boolean> {
    const room = await this.read(id);
    if (!room) return false;

    await this.roomRepository.delete(id);
    return true;
  }

  async exit(key: UserKeyDto) {
    this.logger.log(`exit Room`);
    const user = await this.userService.read(key);
    const room = await this.readMine(key);
    if (!room) throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    await this.userService.update(key, { roomId: -1 });

    if (room.ownerId == user.userId) {
      await this.remove(room.id);
    } else {
      await this.update(key, { cntViewer: room.cntViewer - 1 });
    }
  }

  async joinRoom(
    key: UserKeyDto,
    id: number,
    password?: number,
  ): Promise<Room> {
    this.logger.log(`joinRoom ${id}`);

    const chk = await this.readMine(key);
    if (chk) throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const room = await this.read(id);
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);

    if ((await this.readPW(id)) != password)
      throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);

    this.logger.log(`join room ${id}`);

    await this.update(key, { cntViewer: room.cntViewer + 1 });
    await this.userService.update(key, { roomId: id });

    return await this.readMine(key);
  }

  async roomPeers(
    key: UserKeyDto,
  ): Promise<
    { id: number; name: string; isOwner: boolean; isMe: boolean }[] | false
  > {
    this.logger.log(`roomPeers`);

    const user = await this.userService.read(key);
    if (user.roomId == -1) return false;

    const room = await this.roomRepository.findOneBy({ id: user.roomId });
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

  async updateVideo(key: UserKeyDto, video: RoomVideoDto) {
    const room = await this.readMine(key);
    if (!room) throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    await this.roomRepository.update(room.id, video);
    return true;
  }

  async updateRoom(key: UserKeyDto) {
    const room = await this.readMine(key);
    if (!room) throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    const peers = await this.roomPeers(key);
    return { room, peers };
  }

  async onSocketLogin(client: Socket) {
    this.logger.log(`onSocketLogin ${client.id}`);
    const key = await this.socketService.clientToKey(client);
    if (!key) {
      this.logger.log(`invalid token ${client.id}`);
      client.disconnect();
      return;
    }

    const room = await this.readMine(key);
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

    const room = await this.readMine(key);
    if (!room) return;

    await this.socketService.msgExcludeMe(client, 'roomUpdate', room.id);
    await this.exit(key);
  }

  async updateVideoStatus(client: Socket, videoParseDto: VideoParseDto) {
    const key = await this.socketService.clientToKey(client);
    const { vidName, vidUrl, vidEpisode } = videoParseDto;

    await this.updateVideo(key, {
      vidName,
      vidUrl,
      vidEpisode,
    });

    const room = await this.readMine(key);
    if (!room) return;

    await this.socketService.msgExcludeMe(client, 'roomUpdate', room.id);
  }
}
