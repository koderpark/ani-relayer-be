import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { CreateUserDto } from './user/dto/create-user.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/test2')
  getTest2(@Body() body: any): string {
    return this.appService.getTest();
  }

  @Post('/user/register')
  async dbInsert(@Body() body: CreateUserDto): Promise<string> {
    return await this.userService.create(body);
  }
}
