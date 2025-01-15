import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserMaskedDto } from 'src/user/dto/user-masked.dto';
import { UserService } from 'src/user/user.service';
import { UserKeyDto } from 'src/user/dto/user-key.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private logger: Logger = new Logger('LocalStrategy');

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<UserKeyDto> {
    const userKey = await this.userService.attemptLogin({ email, password });

    if (!userKey) throw new UnauthorizedException();
    return userKey;
  }
}
