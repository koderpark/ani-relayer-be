import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { RoomModule } from './room/room.module';
import { Room } from './room/entities/room.entity';
import { PartyModule } from './party/party.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: process.env.DB,
      password: process.env.DBPW,
      database: 'test',
      entities: [User, Room],
      synchronize: true,
    }),
    SocketModule,
    UserModule,
    RoomModule,
    PartyModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
