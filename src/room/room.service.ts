import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RoomCreateDto } from './dto/room-create.dto';
import { RoomUpdateDto } from './dto/room-update.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomQueryDto } from './dto/room-query.dto';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';
import { RoomMem } from './entities/room-mem.entity';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  RoomList: Map<number, RoomMem>;

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {}

  async create(key: UserKeyDto, body: RoomCreateDto): Promise<RoomQueryDto> {
    this.logger.log(`create ${body.roomName}`);
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

    return room;
  }

  async read(id: number): Promise<RoomQueryDto | null> {
    const room = await this.roomRepository.findOneBy({ roomId: id });
    if (!room) return null;
    return room;
  }

  async readAll(): Promise<RoomQueryDto[]> {
    const room = await this.roomRepository.find();
    return room; // Todo: decorate&filter response
  }

  update(id: number, updateRoomDto: RoomUpdateDto) {
    return `This action updates a #${id} room`;
  }

  async exit(key: UserKeyDto) {
    const user = await this.userService.read(key);
    if (user.roomId == -1)
      throw new HttpException('not_in_room', HttpStatus.BAD_REQUEST);

    const room = await this.roomRepository.findOneBy({ roomId: user.roomId });
    await this.userService.update(key, { roomId: -1 });

    if (room) {
      if (room.ownerId == user.userId) {
        await this.roomRepository.delete(user.roomId);
      } else {
        await this.userService.update(key, { roomId: -1 });
        await this.roomRepository.update(user.roomId, {
          cntViewer: room.cntViewer - 1,
        });
      }
    }
  }

  async checkPW(roomId: number, password?: number): Promise<boolean> {
    const room = await this.roomRepository.findOne({
      where: { roomId },
      select: ['password'],
    });
    if (!room)
      throw new HttpException('room_not_found', HttpStatus.BAD_REQUEST);

    this.logger.log(`checkPW ${room.password} - ${password}`);

    if (room.password == null) return true;
    if (password == null) return false;
    return room.password == password;
  }

  async joinRoom(key: UserKeyDto, roomId: number, password?: number) {
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
  }

  async getMyRoom(key: UserKeyDto): Promise<number> {
    const user = await this.userService.read(key);
    return user.roomId;
  }
}
