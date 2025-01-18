import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthChangePWDto } from './dto/auth-change-pw.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('/login')
  async login(@Req() req, @Body() body: AuthLoginDto): Promise<any> {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('/updatePW')
  async updatePw(@Req() req, @Body() body: AuthChangePWDto): Promise<Boolean> {
    return this.authService.changePassword(req.user, body);
  }

  @Post('/register')
  async register(@Body() body: AuthRegisterDto): Promise<boolean> {
    return await this.authService.register(body);
  }
}
