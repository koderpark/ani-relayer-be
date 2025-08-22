import { BadRequestException, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { VidData, Video } from '../interface';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';

@Injectable()
export class VideoService {
  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
  ) {}

  async update(client: Socket, video: Video): Promise<boolean> {
    const user = await this.userService.read(client.id, ['host']);
    if (!user.host) throw new BadRequestException('not_host');

    const data: VidData = {
      url: video.url,
      speed: video.speed,
      time: video.time,
      isPaused: video.isPaused,
    };

    return await this.roomService.update(client.id, {
      vidTitle: video.title,
      vidEpisode: video.episode,
      vidData: data,
    });
  }
}
