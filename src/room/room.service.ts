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
    if (password !== room.password) return false;
    return true;
  }

  async create(userId: string, name: string, password?: number): Promise<Room> {
    this.logger.log(`create Room ${name}`);

    const owner = await this.userService.read(userId);
    const room = this.roomRepository.create({
      name,
      password,
      owner,
      users: [owner],
    });
    await this.roomRepository.save(room);
    await this.userService.update(userId, { host: room, room: room });
    return room;
  }

  async join(userId: string, roomId: number, password?: number): Promise<Room> {
    const user = await this.userService.read(userId, ['room', 'host']);
    if (user.room) throw new BadRequestException('already_in_room');

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
