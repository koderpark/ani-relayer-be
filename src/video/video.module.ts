import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { RoomModule } from 'src/room/room.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [RoomModule, UserModule],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
