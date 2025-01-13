import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

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
    const user = await this.usersService.findOne(data);

    if (user.password === data.password) {
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
