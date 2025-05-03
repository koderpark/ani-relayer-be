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
@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {}

  async makeResponse(key: UserKeyDto, room: Room): Promise<RoomRespDto> {
    const { roomId, cntViewer, roomName } = room;
    const isOwner = room.ownerId === key.userId;
    return { id: roomId, cntViewer, isOwner, name: roomName };
  }

  async create(key: UserKeyDto, body: RoomCreateDto): Promise<RoomRespDto> {
    this.logger.log(`create Room ${body.roomName}`);
    const chk = await this.userService.read(key);
    if (chk.roomId != -1)
      throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const fill = {
      ownerId: key.userId,
      cntViewer: 1,
      roomName: body.roomName,
      password: body.password,
    };

    const room = this.roomRepository.create(fill);

    await this.roomRepository.save(room);
    await this.userService.update(key, { roomId: room.roomId });
    return this.makeResponse(key, room);
  }

  async myRoom(key: UserKeyDto): Promise<RoomRespDto | false> {
    this.logger.log(`myRoom`);
    const user = await this.userService.read(key);
    const room = await this.roomRepository.findOneBy({ roomId: user.roomId });
    if (!room) return false;
    return this.makeResponse(key, room);
  }

  async read(id: number): Promise<RoomQueryDto | null> {
    this.logger.log(`read Room ${id}`);
    const room = await this.roomRepository.findOneBy({ roomId: id });
    if (!room) return null;
    return room;
  }

  async readAll(): Promise<RoomQueryDto[]> {
    this.logger.log(`readAll`);
    const room = await this.roomRepository.find();
    return room;
  }

  async update(id: number, updateRoomDto: RoomUpdateDto) {
    this.logger.log(`update Room ${id}`);
    return `This action updates a #${id} room`;
  }

  async exit(key: UserKeyDto) {
    this.logger.log(`exit Room`);
    const user = await this.userService.read(key);
    if (user.roomId == -1)
      throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    const room = await this.roomRepository.findOneBy({ roomId: user.roomId });
    await this.userService.update(key, { roomId: -1 });

    if (room) {
      if (room.ownerId == user.userId) {
        await this.roomRepository.delete(user.roomId);
      } else {
        await this.roomRepository.update(user.roomId, {
          cntViewer: room.cntViewer - 1,
        });
      }
    }
  }

  async checkPW(roomId: number, password?: number): Promise<boolean> {
    this.logger.log(`checkPW ${roomId} - ${password}`);
    const test = await this.roomRepository.findOneBy({ roomId });
    console.log(test);
    const room = await this.roomRepository.findOne({
      where: { roomId: roomId },
      select: ['roomId', 'password'],
    });
    console.log(room);
    if (!room)
      throw new HttpException(
        'room_not_found_at_checkPW',
        HttpStatus.BAD_REQUEST,
      );

    this.logger.log(`checkPW ${room.password} - ${password}`);
    return room.password == password;
  }

  async joinRoom(
    key: UserKeyDto,
    roomId: number,
    password?: number,
  ): Promise<RoomRespDto> {
    this.logger.log(`joinRoom ${roomId}`);
    const user = await this.userService.read(key);

    if (user.roomId != -1)
      throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const room = await this.roomRepository.findOneBy({ roomId });
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);

    if (!(await this.checkPW(roomId, password))) {
      this.logger.log(`wrong password ${roomId} ${password}`);
      throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`join room ${roomId}`);
    await this.roomRepository.update(roomId, {
      cntViewer: room.cntViewer + 1,
    });

    await this.userService.update(key, { roomId });
    return this.makeResponse(key, room);
  }

  async roomPeers(
    roomId: number,
  ): Promise<{ id: number; name: string; isOwner: boolean }[]> {
    this.logger.log(`roomPeers ${roomId}`);
    const room = await this.roomRepository.findOneBy({ roomId });
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);

    const member = await this.userService.roomMembers(roomId);
    const peers = member.map((member) => {
      return {
        id: member.id,
        name: member.name,
        isOwner: member.id == room.ownerId,
      };
    });
    return peers;
  }

  async updateVideoMetadata(roomId: number, url: string) {
    await this.roomRepository.update(roomId, { vidUrl: url });
  }
}
