import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { databaseProviders } from './db.providers';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './db.entity';
import { userProviders } from './user.providers';

@Module({
  imports: [ConfigModule.forRoot(), SocketModule],
  controllers: [AppController],
  providers: [AppService, ...databaseProviders, ...userProviders],
})
export class AppModule {}
