import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { VidData, Video } from 'src/room/entities/room.entity';
import { RoomService } from 'src/room/room.service';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class VideoService {
  constructor(
    private readonly roomService: RoomService,
    private readonly socketService: SocketService,
  ) {}

  async update(client: Socket, video: Video): Promise<boolean> {
    const key = await this.socketService.clientToKey(client);
    const room = await this.roomService.readMine(key);
    if (!room) return false;

    if (key.userId != room.ownerId) return false;

    const data: VidData = {
      url: video.url,
      speed: video.speed,
      time: video.time,
      isPaused: video.isPaused,
    };

    this.socketService.msgExcludeMe(client, 'video', data);

    return await this.roomService.updateMine(key, {
      vidTitle: video.title,
      vidEpisode: video.episode,
      vidData: data,
    });
  }
}
