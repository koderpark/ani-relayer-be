import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SocketModule } from './socket/socket.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { RoomModule } from './room/room.module';
import { Room } from './room/entities/room.entity';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'koder.page',
      port: 3307,
      username: process.env.DB,
      password: process.env.DBPW,
      database: 'laftelsync',
      entities: [User, Room],
      synchronize: true,
    }),
    SocketModule,
    UserModule,
    RoomModule,
    VideoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
