import { Injectable, Logger } from '@nestjs/common';
import { RoomCreateDto } from './dto/room-create.dto';
import { RoomUpdateDto } from './dto/room-update.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomQueryDto } from './dto/room-query.dto';
import { UserKeyDto } from 'src/user/dto/user-key.dto';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async create(key: UserKeyDto, body: RoomCreateDto): Promise<RoomQueryDto> {
    const fill = {
      ownerId: key.userId,
      code: await this.generateCode(),
      cntViewer: 1,
      roomName: body.roomName,
    };

    const room = this.roomRepository.create(fill);
    await this.roomRepository.save(room);
    return room;
  }

  findAll() {
    return `This action returns all room`;
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  update(id: number, updateRoomDto: RoomUpdateDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }

  async generateCode(): Promise<number> {
    return -1;
  }
}
