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
import { PublicRoom, RoomInfo } from '../interface';

@Injectable()
export class RoomService {
  private logger: Logger = new Logger('RoomService');

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private readonly userService: UserService,
  ) {
    this.logger.debug('Remove Leftover Rooms');
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
    if (room.password === null && password === null) return true;
    if (password !== room.password) return false;
    return true;
  }

  async create(userId: string, name: string, password?: number): Promise<Room> {
    const owner = await this.userService.read(userId);

    const room = new Room();
    room.name = name;
    room.password = password;
    room.host = owner;

    const savedRoom = await this.roomRepository.save(room);

    await this.userService.update(userId, {
      host: savedRoom,
      room: savedRoom,
    });

    this.logger.log(`create Room ${name} by ${userId}`);
    this.logger.debug(`Room UUID: ${savedRoom.uuid}`);
    return savedRoom;
  }

  async join(userId: string, roomId: number, password?: number): Promise<Room> {
    const user = await this.userService.read(userId, ['room', 'host']);
    if (user.host) throw new BadRequestException('already_host');

    const room = await this.read(roomId, ['users']);

    if (!(await this.chkPW(roomId, password)))
      throw new BadRequestException('wrong_password');

    await this.userService.update(userId, { room });

    this.logger.log(`join Room User:${userId} to Room:${roomId}`);
    return room;
  }

  async link(userId: string, uuid: string): Promise<Room> {
    const user = await this.userService.read(userId, ['room', 'host']);
    if (user.host) throw new BadRequestException('already_host');

    const room = await this.readByUuid(uuid, ['users']);

    this.logger.log(`make link Room:${room.id}`);
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

  async readByUuid(uuid: string, relations: string[] = []): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { uuid },
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

    this.logger.log(`remove Room User:${userId} Room:${user.host.id}`);
    await this.roomRepository.softDelete(user.host.id);
    return true;
  }

  async removeAll(): Promise<boolean> {
    this.logger.warn(`remove All Rooms`);
    const res = await this.roomRepository
      .createQueryBuilder()
      .softDelete()
      .where('deletedAt IS NULL')
      .execute();
    return res.affected ? true : false;
  }

  async roomInfo(roomId: number): Promise<RoomInfo | null> {
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
      vidStartedAt: room.vidStartedAt,
      vidLastUpdatedAt: room.vidLastUpdatedAt,
    };
  }

  async readAllPublic(): Promise<PublicRoom[]> {
    const rooms = await this.roomRepository.find({
      relations: ['users', 'host'],
    });
    return Promise.all(rooms.map((room) => this.publicRoom(room)));
  }

  async statistics(): Promise<{ roomCnt: number; timeSum: number }> {
    const roomCnt = await this.roomRepository.count({ withDeleted: true });

    const raw = await this.roomRepository
      .createQueryBuilder('room')
      .withDeleted()
      .select(
        'SUM(TIMESTAMPDIFF(MINUTE, room.vidStartedAt, room.vidLastUpdatedAt))',
        'sum',
      )
      .where('room.vidStartedAt IS NOT NULL')
      .getRawOne<{ sum: string }>();

    return {
      roomCnt,
      timeSum: Number(raw.sum) || 0,
    };
  }
}

