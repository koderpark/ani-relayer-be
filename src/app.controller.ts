import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TestDto } from './testDto';
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

  @Get('/test')
  getTest(@Query() body: TestDto): string {
    return this.appService.getTest(body);
  }

  @Post('/test2')
  getTest2(@Body() body: TestDto): string {
    return this.appService.getTest2();
  }

  @Post('/user/register')
  async dbInsert(@Body() body: CreateUserDto): Promise<string> {
    return await this.userService.dbInsert(body);
  }
}
