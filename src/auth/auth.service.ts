import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { User } from 'src/user/entities/user.entity';
import { UserMaskedDto } from 'src/user/dto/user-masked.dto';
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
    const user = await this.userService.readWithPW(key);
    const comp = await bcrypt.compare(data.oldPassword, user.password);

    if (comp) {
      const { password, ...rest } = user;
      const newPW = await bcrypt.hash(data.newPassword, 10);
      return await this.userService.update(key, { password: newPW });
    } else throw new HttpException('wrong_password', HttpStatus.BAD_REQUEST);
  }

  async chkPassword(data: AuthLoginDto) {
    const user = await this.userService.readWithPW({ loginId: data.loginId });
    if (!user) return null;

    const comp = await bcrypt.compare(data.password, user.password);
    if (comp) {
      const { userId, ...rest } = user;
      return { userId };
    } else return null;
  }
}
