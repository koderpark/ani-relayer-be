import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { RoomModule } from 'src/room/room.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [RoomModule, SocketModule],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
