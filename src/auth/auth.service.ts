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

  async login(key: UserKeyDto) {
    const payload = { id: key.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(body: AuthRegisterDto) {
    const chk = await this.userService.countByEmail(body.email);
    if (chk != 0)
      throw new HttpException('already_used_email', HttpStatus.BAD_REQUEST);

    body.password = await bcrypt.hash(body.password, 10);
    return await this.userService.create(body);
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
    const user = await this.userService.readWithPW({ email: data.email });
    if (!user) return null;

    const comp = await bcrypt.compare(data.password, user.password);
    if (comp) {
      const { id, ...rest } = user;
      return { id };
    } else return null;
  }
}
