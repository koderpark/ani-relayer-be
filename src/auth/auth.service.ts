import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger('authService');

  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(data: LoginUserDto): Promise<{
    name: string;
    email: string;
    id: number;
  }> {
    // this.logger.log(`${data.email} / ${data.password}`);
    const user = await this.usersService.findOne(data);
    const comp = await bcrypt.compare(data.password, user.password);
    if (user && comp) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    this.logger.log({ ...user });
    const payload = { name: user.name, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
