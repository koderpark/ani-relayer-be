import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
