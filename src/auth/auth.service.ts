import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { User } from 'src/user/entities/user.entity';
import { UserMaskedDto } from 'src/user/dto/user-masked.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { UserKeyDto } from 'src/user/dto/user-key.dto';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger('authService');

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(key: UserKeyDto) {
    this.logger.log({ ...key });
    const payload = { sub: key.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(body: AuthRegisterDto) {
    return await this.userService.create(body);
  }
}
