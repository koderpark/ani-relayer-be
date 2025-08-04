import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {}

  async chkHost(userId: string): Promise<boolean> {
    const user = await this.userService.read(userId, ['host']);
    return user.host ? true : false;
  }

  async chkPW(id: number, password?: number): Promise<boolean> {
    const room = await this.roomRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!room) return false;
    if (room.password === null && password === undefined) return true;
    if (password !== room.password) return false;
    return true;
  }

  async create(userId: string, name: string, password?: number): Promise<Room> {
    this.logger.log(`create Room ${name} by ${userId}`);

    const owner = await this.userService.read(userId);

    const room = this.roomRepository.create({ name, password, host: owner });
    const savedRoom = await this.roomRepository.save(room);

    await this.userService.update(userId, {
      host: savedRoom,
      room: savedRoom,
    });

    return savedRoom;
  }

  async join(userId: string, roomId: number, password?: number): Promise<Room> {
    const user = await this.userService.read(userId, ['room', 'host']);
    if (user.host) throw new BadRequestException('already_host');

    const room = await this.read(roomId, ['users']);

    if (!(await this.chkPW(roomId, password)))
      throw new BadRequestException('wrong_password');

    await this.userService.update(userId, { room });
    return room;
  }

  async read(id: number, relations: string[] = []): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations,
    });

    if (!room) throw new NotFoundException();
    return room;
  }

  async readMine(userId: string): Promise<Room> {
    const user = await this.userService.read(userId, ['room']);
    if (!user.room) throw new NotFoundException();
    return user.room;
  }

  async update(userId: string, data: Partial<Room>): Promise<boolean> {
    const user = await this.userService.read(userId, ['room', 'host']);
    if (!user.host) throw new HttpException('not_host', HttpStatus.FORBIDDEN);

    const res = await this.roomRepository.update(user.host.id, data);
    return res.affected ? true : false;
  }

  async remove(userId: string): Promise<boolean> {
    const user = await this.userService.read(userId, ['room', 'host']);
    if (!user.host) throw new HttpException('not_host', HttpStatus.FORBIDDEN);

    await this.roomRepository.delete(user.host.id);
    return true;
  }

  async removeAll(): Promise<boolean> {
    const res = await this.roomRepository.delete({});
    return res.affected ? true : false;
  }
}
