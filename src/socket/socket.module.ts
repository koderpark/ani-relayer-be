import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UserModule } from 'src/user/user.module';
import { SocketGateway } from './socket.gateway';
import { RoomModule } from 'src/room/room.module';
import { VideoModule } from 'src/video/video.module';

@Module({
  imports: [UserModule],
  providers: [SocketService, SocketGateway],
  exports: [SocketService],
})
export class SocketModule {}
