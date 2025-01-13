import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/user/dto/login-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private logger: Logger = new Logger('LocalStrategy');

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<{ id: number; name: string; email: string }> {
    const user = await this.authService.validateUser({
      email: username,
      password: password,
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
