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

export interface RoomMetadata {
  id: number;
  name: string;
  host: string;
  user: {
    id: string;
    name: string;
    isHost: boolean;
  }[];
}

export interface PublicRoom {
  id: number;
  name: string;
  host: string; // username
  userCount: number; // count
  vidTitle: string;
  vidEpisode: string;
  isLocked: boolean;
}

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {
    this.logger.log('Remove Leftover Rooms');
    this.removeAll();
  }

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

  async roomMetadata(roomId: number): Promise<RoomMetadata | null> {
    try {
      const room = await this.read(roomId, ['users', 'host']);
      const userList = room.users
        .map((user) => ({
          id: user.id,
          name: user.name,
          isHost: user.id === room.host.id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        id: room.id,
        name: room.name,
        host: room.host.id,
        user: userList,
      };
    } catch (error) {
      return null;
    }
  }

  async publicRoom(room: Room): Promise<PublicRoom> {
    const password = await this.roomRepository.findOne({
      where: { id: room.id },
      select: ['id', 'password'],
    });

    return {
      id: room.id,
      name: room.name,
      host: room.host.name,
      userCount: room.users.length,
      vidTitle: room.vidTitle,
      vidEpisode: room.vidEpisode,
      isLocked: password.password !== null,
    };
  }

  async readAllPublic(): Promise<PublicRoom[]> {
    const rooms = await this.roomRepository.find({
      relations: ['users', 'host'],
    });
    return Promise.all(rooms.map((room) => this.publicRoom(room)));
  }
}
