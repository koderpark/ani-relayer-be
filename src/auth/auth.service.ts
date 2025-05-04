import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { UserKeyDto } from 'src/user/dto/user-key.dto';
import { AuthChangePWDto } from './dto/auth-change-pw.dto';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger('authService');

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(key: UserKeyDto, data: AuthLoginDto) {
    const payload = { userId: key.userId, loginId: data.loginId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: AuthRegisterDto) {
    const chk = await this.userService.chkId(data.loginId);
    if (!chk)
      throw new HttpException('already_used_id', HttpStatus.BAD_REQUEST);

    data.password = await bcrypt.hash(data.password, 10);
    return await this.userService.create(data);
  }

  async changePassword(key: UserKeyDto, data: AuthChangePWDto) {
    const password = await this.userService.readPW(key);
    const comp = await bcrypt.compare(data.oldPassword, password);

    if (comp) {
      const newPW = await bcrypt.hash(data.newPassword, 10);
      return await this.userService.update(key, { password: newPW });
    } else throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);
  }

  async chkPassword(data: AuthLoginDto) {
    const password = await this.userService.readPW({ loginId: data.loginId });
    if (!password) return null;

    const comp = await bcrypt.compare(data.password, password);
    if (comp) {
      return { userId: data.loginId };
    } else return null;
  }

  async jwtVerify(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      return null;
    }
  }
}
