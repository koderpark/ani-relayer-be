import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { VidData, Video } from 'src/room/entities/room.entity';
import { RoomService } from 'src/room/room.service';
import { SocketService } from 'src/socket/socket.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class VideoService {
  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
  ) {}

  async update(client: Socket, video: Video): Promise<boolean> {
    const user = await this.userService.read(client.id);
    const room = await this.roomService.readMine(client.id);
    if (!room) return false;

    if (user.userId != room.ownerId) return false;

    const data: VidData = {
      url: video.url,
      speed: video.speed,
      time: video.time,
      isPaused: video.isPaused,
    };

    this.socketService.msgExcludeMe(client, 'video', data);

    return await this.roomService.updateMine(client.id, {
      vidTitle: video.title,
      vidEpisode: video.episode,
      vidData: data,
    });
  }
}
