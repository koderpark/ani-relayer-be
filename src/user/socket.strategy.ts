import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { UserService } from './user.service';

@Injectable()
export class SocketStrategy extends PassportStrategy(Strategy, 'socket') {
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
export class SocketGuard extends AuthGuard('socket') {}
