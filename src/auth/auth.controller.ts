import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthChangePWDto } from './dto/auth-change-pw.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { parseKey } from 'src/utils/parse';
import { User } from 'src/user/entities/user.entity';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('/login')
  async login(@Req() req, @Body() body: AuthLoginDto): Promise<any> {
    return this.authService.login(parseKey(req.user), body);
  }

  @Post('/register')
  async register(@Body() body: AuthRegisterDto): Promise<User> {
    return await this.authService.register(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/updatePW')
  async updatePw(@Req() req, @Body() body: AuthChangePWDto): Promise<Boolean> {
    return this.authService.changePassword(parseKey(req.user), body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/chkJWT')
  async chkJWT(@Req() req): Promise<Boolean> {
    return true;
  }
}
