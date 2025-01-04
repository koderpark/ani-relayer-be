import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TestDto } from './testDto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
