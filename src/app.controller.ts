import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { CreateUserDto } from './user/dto/create-user.dto';
import { LoginUserDto } from './user/dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Req() req, @Body() data: LoginUserDto): Promise<any> {
    return this.authService.login(req.user);
  }

  @Get('/user/findOne')
  async validate(@Query() query: LoginUserDto): Promise<any> {
    return this.userService.findOne(query);
  }

  @Post('/user/register')
  async dbInsert(@Body() body: CreateUserDto): Promise<string> {
    return await this.userService.create(body);
  }
}
