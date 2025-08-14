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

@Controller()
export class AppController {
  private logger: Logger = new Logger('appController');

  constructor() {}

  @Get()
  getHello(): string {
    return 'Hello Laftelsync!';
  }
}
