import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UserModule } from '../user/user.module';
import { SocketGateway } from './socket.gateway';
import { RoomModule } from '../room/room.module';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [UserModule, RoomModule, VideoModule],
  providers: [SocketService, SocketGateway],
  exports: [SocketService],
})
export class SocketModule {}
