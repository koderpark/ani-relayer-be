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
      host: process.env.DBIP,
      port: parseInt(process.env.DBPORT),
      username: process.env.DBUSER,
      password: process.env.DBPW,
      database: process.env.DBNAME,
      entities: [User, Room],
      synchronize: process.env.NODE_ENV === 'development' ? true : false,
    }),
    SocketModule,
    UserModule,
    RoomModule,
    VideoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
