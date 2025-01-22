import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RoomCreateDto } from './dto/room-create.dto';
import { RoomUpdateDto } from './dto/room-update.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomQueryDto } from './dto/room-query.dto';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {}

  async create(key: UserKeyDto, body: RoomCreateDto): Promise<RoomQueryDto> {
    const chk = await this.userService.read(key);
    if (chk.roomId != -1)
      throw new HttpException('already_in_room', HttpStatus.BAD_REQUEST);

    const fill = {
      ownerId: key.userId,
      code: await this.generateCode(),
      cntViewer: 1,
      roomName: body.roomName,
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

  remove(id: number) {
    return `This action removes a #${id} room`;
  }

  async generateCode(): Promise<number> {
    // make a random non-colide code
    return Math.random() * 100000;
  }
}
