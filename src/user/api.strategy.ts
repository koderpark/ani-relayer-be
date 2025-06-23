import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { UserService } from './user.service';

@Injectable()
export class ApiStrategy extends PassportStrategy(Strategy, 'api') {
  constructor(private readonly userService: UserService) {
    super();
  }

  async validate(req: any) {
    const user = await this.userService.read(req.headers.socketId);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

@Injectable()
export class ApiGuard extends AuthGuard('api') {}
