import { Module } from '@nestjs/common';
import { PartyService } from './party.service';
import { RoomModule } from 'src/room/room.module';
import { UserModule } from 'src/user/user.module';
import { SocketModule } from 'src/socket/socket.module';
import { PartyController } from './party.controller';

@Module({
  imports: [RoomModule, UserModule, SocketModule],
  providers: [PartyService],
  exports: [PartyService],
  controllers: [PartyController],
})
export class PartyModule {}
