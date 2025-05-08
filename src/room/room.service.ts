import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RoomCreateDto } from './dto/room-create.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';
import { RoomUpdateDto } from './dto/room-update.dto';
import { RoomStatusDto } from './dto/room-resp.dto';
import { RoomPeerDto } from './dto/room-peer.dto';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {}

  async create(key: UserKeyDto, body: RoomCreateDto): Promise<Room> {
    this.logger.log(`create Room ${body.name}`);

    const room = this.roomRepository.create(body);
    await this.roomRepository.save(room);
    await this.userService.update(key, { roomId: room.id });
    return room;
  }

  async read(id: number): Promise<Room> {
    return await this.roomRepository.findOneBy({ id });
  }

  async readAll(): Promise<Room[]> {
    return await this.roomRepository.find();
  }

  async readMine(key: UserKeyDto): Promise<Room> {
    const user = await this.userService.read(key);
    if (user.roomId == -1) return null;

    return await this.read(user.roomId);
  }

  async updateMine(key: UserKeyDto, data: RoomUpdateDto): Promise<boolean> {
    const room = await this.readMine(key);
    if (!room) return false;

    const res = await this.roomRepository.update(room.id, data);
    return res.affected ? true : false;
  }

  async remove(id: number): Promise<boolean> {
    const room = await this.read(id);
    if (!room) return false;
    if ((await this.userService.countMember(id)) > 0) return false;

    await this.roomRepository.delete(id);
    return true;
  }

  async chkPW(id: number, password?: number): Promise<boolean> {
    const room = await this.roomRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!room) return false;
    if (password && room.password != password) return false;
    if (!password && room.password) return false;

    return true;
  }

  async peers(key: UserKeyDto): Promise<RoomPeerDto[]> {
    this.logger.log(`peers`);

    const room = await this.readMine(key);
    if (!room) return [];

    const member = await this.userService.listMember(room.id);
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

  async roomStatus(key: UserKeyDto): Promise<RoomStatusDto> {
    const room = await this.readMine(key);
    if (!room) return null;

    return {
      id: room.id,
      cntViewer: await this.userService.countMember(room.id),
      isOwner: room.ownerId == key.userId,
      name: room.name,
      peers: await this.peers(key),
    };
  }

  async removeAll(): Promise<boolean> {
    const res = await this.roomRepository.delete({});
    return res.affected ? true : false;
  }

  // async updateVideo(key: UserKeyDto, video: RoomVideoDto) {
  //   const room = await this.readMine(key);
  //   if (!room) throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

  //   console.log(video);
  //   // await this.roomRepository.update(room.id, video);
  //   return true;
  // }

  // async updateVideoStatus(client: Socket, videoParseDto: VideoParseDto) {
  //   const key = await this.socketService.clientToKey(client);
  //   const { vidName, vidUrl, vidEpisode } = videoParseDto;

  //   await this.updateVideo(key, {
  //     vidName,
  //     vidUrl,
  //     vidEpisode,
  //   });

  //   const room = await this.readMine(key);
  //   if (!room) return;

  //   await this.socketService.msgExcludeMe(client, 'roomUpdate', room.id);
  // }
}
