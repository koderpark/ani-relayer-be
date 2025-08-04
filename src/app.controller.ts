import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
export class AppController {
  private logger: Logger = new Logger('appController');

  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('/user/rawJwt')
  getPK(@Req() req) {
    return req.user;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('api'))
  @Get('/user/read')
  async validate(@Req() req): Promise<any> {
    return this.userService.read(req.user.socketId);
  }
}
