import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('/login')
  async login(@Req() req, @Body() body: AuthLoginDto): Promise<any> {
    return this.authService.login(req.user);
  }

  @Post('/register')
  async register(@Body() body: AuthRegisterDto): Promise<string> {
    return await this.authService.register(body);
  }
}
